#!/usr/bin/env node
"use strict";

//@ts-ignore
let pkg = require("../package.json");

let Fs = require("node:fs/promises");

let Base58Check = require("@dashincubator/base58check").Base58Check;
let DashKeys = require("dashkeys");
let DashKeysVersion = require("dashkeys/package.json").version;
let Secp256k1 = require("@dashincubator/secp256k1");

let toBytes = DashKeys.utils.hexToBytes;
let toHex = DashKeys.utils.bytesToHex;
let b58c = Base58Check.create();
//let dk58c = DashKeys.Base58Check.create();

// let Qr = require("./qr.js");

/**
 * @typedef FsStoreConfig
 * @prop {String} dir
 * @prop {String} cachePath
 * @prop {String} payWalletsPath
 * @prop {String} preferencesPath
 * @prop {String} privateWalletsPath
 */

/**
 * @callback Subcommand
 * @param {Array<String>} args
 */

let jsonOut = "";
let unsafe = "";
let unmask = "";
let network = "mainnet";

async function main() {
  /* jshint maxcomplexity:1000 */
  let args = process.argv.slice(2);

  let version = removeFlag(args, ["version", "-V", "--version"]);
  if (version) {
    console.info(`dashkeys-cli v${pkg.version} (dashkeys v${DashKeysVersion})`);
    process.exit(0);
    return;
  }

  jsonOut = removeFlag(args, ["--json"]) ?? "";
  unsafe = removeFlag(args, ["--unsafe"]) ?? "";
  unmask = removeFlag(args, ["--unmask"]) ?? "";
  let isTestnet = removeFlag(args, ["--testnet"]);
  if (isTestnet) {
    network = "testnet";
  }

  let gen = removeFlag(args, ["generate"]);
  if (gen) {
    await generateWif(args);
    return;
  }

  let getAddr = removeFlag(args, ["address", "pub"]);
  if (getAddr) {
    await getPaymentAddress(args);
    return;
  }

  let decodeAddr = removeFlag(args, ["decode", "inspect"]);
  if (decodeAddr) {
    await decode(args);
    return;
  }

  let checkAddr = removeFlag(args, ["verify", "validate"]);
  if (checkAddr) {
    await verify(args);
    return;
  }

  let help = removeFlag(args, ["help", "--help", "-h"]);
  if (help) {
    usage();
    return null;
  }

  if (!args[0]) {
    usage();
    process.exit(1);
    return;
  }

  throw new Error(`'${args[0]}' is not a recognized subcommand`);
}

/**
 * @param {Uint8Array} privBuf
 */
function toPublicKeyUncompressed(privBuf) {
  let isCompressed = false;
  return Secp256k1.getPublicKey(privBuf, isCompressed);
}

/**
 * @param {Array<String>} arr
 * @param {Array<String>} aliases
 * @returns {String?}
 */
function removeFlag(arr, aliases) {
  /** @type {String?} */
  let arg = null;
  aliases.forEach(function (item) {
    let index = arr.indexOf(item);
    if (-1 === index) {
      return null;
    }

    if (arg) {
      throw Error(`duplicate flag ${item}`);
    }

    arg = arr.splice(index, 1)[0];
  });

  return arg;
}

function usage() {
  console.info();
  console.info(`USAGE`);
  console.info();
  console.info(`    dashkeys address <./file.wif>    convert WIF to Pay Addr`);
  console.info(`    dashkeys generate                create WIF [DEV TOOL]`);
  console.info(`    dashkeys inspect <addr-or-file>  decode base58check`);
  console.info(`    dashkeys verify <addr-or-file>   validate checksum`);
  console.info();
  console.info(`    dashkeys help     show this menu`);
  console.info(`    dashkeys version  show version`);
  console.info();
  console.info(`GLOBAL FLAGS`);
  console.info();
  console.info(`    --json             machine-friendly json to stdout`);
  console.info(
    `    --testnet          expect coin types 0xef (key) and 0x8c (address)`,
  );
  console.info(`    --unmask           don't mask private keys`);
  console.info(
    `    --unsafe           accept as string (exposed to shell history)`,
  );
  console.info();
}

/** @type {Subcommand} */
async function generateWif(args) {
  let wif = await DashKeys.utils.generateWifNonHd({ version: network });
  let addr = await DashKeys.wifToAddr(wif, { version: network });

  if (jsonOut) {
    let result = {
      wif: wif,
      address: addr,
    };
    console.info(JSON.stringify(result, null, 2));
    return;
  }

  await Fs.writeFile(`./${addr}.wif`, wif, "ascii");

  console.error(`THIS IS AN OPTION FOR DEVELOPERS`);
  console.error(`Use Dash Wallet or Dash HD to generate recoverable (HD) keys`);
  console.info();
  console.info(`Saved new private key to './${addr}.wif'`);
  console.info();
}

/** @type {Subcommand} */
async function getPaymentAddress(args) {
  let [addrOrPath] = args;

  let { addrOrWif, isString } = await readAddrOrPath(addrOrPath);
  if (isString) {
    if (!unsafe) {
      throw newExposedKeyError();
    }
  }

  if (52 !== addrOrWif.length) {
    throw newError(
      "E_BAD_INPUT",
      `a valid WIF is 52 characters in length, not '${addrOrWif.length}'`,
    );
  }

  let b58cInfo = await DashKeys.decode(addrOrWif, {
    validate: false,
    version: network,
  });

  let _publicKey;
  let _pubKeyHash;
  let address;
  if (b58cInfo.privateKey) {
    let privBytes = toBytes(b58cInfo.privateKey);
    let pubBytes = await DashKeys.utils.toPublicKey(privBytes, {
      version: network,
    });
    _publicKey = toHex(pubBytes);
    address = await DashKeys.pubkeyToAddr(pubBytes, {
      version: network,
    });
  } else {
    address = addrOrWif;
  }

  if (jsonOut) {
    let result = {
      address,
      _pubKeyHash,
      _publicKey,
    };
    console.info(JSON.stringify(result, null, 2));
    return;
  }

  console.info();
  console.info(`Pay Addr is ${address}`);
  console.info();
}

// TODO expose in Base58Check?
let BASE58 = `123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`;
let b58re = new RegExp(`^[${BASE58}]+$`);

/** @type {Subcommand} */
async function decode(args) {
  let [addrOrPath] = args;

  let { addrOrWif, isString } = await readAddrOrPath(addrOrPath);

  let decoded = await DashKeys.decode(addrOrWif, {
    version: network,
  });
  if (decoded.privateKey) {
    let debug = {};

    //
    // Compressed (correct)
    //
    let pubBuf = await DashKeys.utils.toPublicKey(decoded.privateKey);
    //@ts-ignore
    decoded.publicKey = toHex(pubBuf);
    let shaRipeBytes = await DashKeys.pubkeyToPkh(pubBuf);
    decoded.pubKeyHash = toHex(shaRipeBytes);

    let pubKeySha256U8 = await DashKeys.utils.sha256sum(pubBuf);
    debug.pubKeySha256 = toHex(pubKeySha256U8);

    let pubKeyRipeMd160U8 = await DashKeys.utils.ripemd160sum(pubBuf);
    debug._pkrmd160 = toHex(pubKeyRipeMd160U8);

    let pkh = await DashKeys.utils.ripemd160sum(pubKeySha256U8);
    debug._pubKeyHash = toHex(pkh);

    debug._address = await b58c.encode({
      pubKeyHash: debug._pubKeyHash,
      version: network,
    });

    //
    // Uncompressed (wrong)
    //
    let xyPubKey = toPublicKeyUncompressed(decoded.privateKey);
    //@ts-ignore
    debug._xyPublicKey = toHex(xyPubKey);

    let xyPubKeySha256U8 = await DashKeys.utils.sha256sum(xyPubKey);
    debug._xyPksha256 = toHex(xyPubKeySha256U8);

    let xyPubKeyRipeMd160U8 = await DashKeys.utils.ripemd160sum(xyPubKey);
    debug._xyPkrmd160 = toHex(xyPubKeyRipeMd160U8);

    let xyPkh = await DashKeys.utils.ripemd160sum(xyPubKeySha256U8);
    debug._xyPubKeyHash = toHex(xyPkh);

    debug._xyAddress = await b58c.encode({
      pubKeyHash: debug._xyPubKeyHash,
      version: network,
    });

    debug._xyWif = await b58c.encode({
      privateKey: decoded.privateKey,
      compressed: false,
      version: network,
    });

    if (!unmask) {
      decoded.privateKey = maskPrivateKey(decoded.privateKey);
      debug._xyWif = maskPrivateKey(debug._xyWif);
    }

    let address = await DashKeys.wifToAddr(addrOrWif, {
      version: network,
    });
    decoded = Object.assign({ address }, decoded, debug);
  }

  if (jsonOut) {
    console.info(JSON.stringify(decoded, null, 2));
    return;
  }

  let wout = function () {
    //@ts-ignore
    console.info.apply(console, arguments);
  };

  if (!decoded.valid) {
    wout = function () {
      //@ts-ignore
      console.error.apply(console, arguments);
    };
  }

  wout();
  if (isString) {
    if (decoded.privateKey) {
      if (!unsafe) {
        throw newExposedKeyError();
      }
      wout(`Decoded Private Key string:`);
    } else {
      wout(`Decoded Pay Addr string:`);
    }
  } else {
    if (decoded.privateKey) {
      wout(`Decoded Private Key file '${addrOrPath}':`);
    } else {
      wout(`Decoded Pay Addr file '${addrOrPath}':`);
    }
  }

  wout();
  wout(`    Valid:       ${decoded.valid}`);
  wout(`    Version:     ${decoded.version}`);
  if (decoded.pubKeyHash) {
    wout(`    PubKey Hash: ${decoded.pubKeyHash}`);
  }
  if (decoded.privateKey) {
    //@ts-ignore - TODO make new definition for CLI
    wout(`    Pay Addr:    ${decoded.address}`);
    wout(`    Private Key: ${decoded.privateKey}`);
  }
  wout(`    Check:       ${decoded.check}`);
  wout();
}

/** @type {Subcommand} */
async function verify(args) {
  let [addrOrPath] = args;

  let { addrOrWif, isString } = await readAddrOrPath(addrOrPath);

  let decoded = await DashKeys.decode(addrOrWif, {
    version: network,
  });
  let status = "invalid";
  if (decoded.valid) {
    status = "valid";
  }

  if (jsonOut) {
    let result = {
      valid: decoded.valid,
      isPrivate: !!decoded.privateKey,
      pubKeyHash: decoded.pubKeyHash,
    };
    console.info(JSON.stringify(result, null, 2));
    return;
  }

  let wout = function () {
    //@ts-ignore
    console.info.apply(console, arguments);
  };

  if (!decoded.valid) {
    wout = function () {
      //@ts-ignore
      console.error.apply(console, arguments);
    };
  }

  if (!isString) {
    wout();
    if (decoded.privateKey) {
      wout(`Private Key file ${status}`);
    } else {
      wout(`Pay Addr file ${status}`);
    }
    wout();
    return;
  }

  if (!decoded.privateKey) {
    wout();
    wout(`Pay Addr string is ${status}`);
    wout(`(Pub Key Hash: ${decoded.pubKeyHash})`);
    wout();
    return;
  }

  if (!unsafe) {
    throw newExposedKeyError();
  }

  wout();
  wout(`Private Key string is ${status}`);
  wout();
}

/**
 * @param {String} addrOrPath
 */
async function readAddrOrPath(addrOrPath) {
  let isString = false;
  let txt = await Fs.readFile(addrOrPath, "ascii").catch(function (err) {
    if ("ENOENT" !== err.code) {
      throw err;
    }

    isString = true;
    return addrOrPath;
  });
  let addrOrWif = txt.trim();

  let isValid = b58re.test(addrOrWif);
  if (!isValid) {
    throw newError(
      "E_BAD_INPUT",
      `'${addrOrWif}' is not a valid WIF or Pay Addr`,
    );
  }

  return {
    isString,
    addrOrWif,
  };
}

/**
 * @param {String} privateKey - hex private key
 */
function maskPrivateKey(privateKey) {
  // 66 + -2 + -2;
  let maskLen = privateKey.length + -2 + -2;
  let mask = "*".repeat(maskLen);
  let first2 = privateKey.slice(0, 2);
  let last2 = privateKey.slice(-2);

  let privateKeyMask = `${first2}${mask}${last2}`;
  return privateKeyMask;
}

/**
 * A `detail`ed, `code`d error message. Throw it yourself.
 * @param {String} code - all uppercase with underscores, for machines (ex: E_BAD_INPUT)
 * @param {String} message - all lowercase, no punctuation, for devs (ex: "failed to parse '${x}'")
 * @param {any} [details] - extra details for machine or devs
 */
function newError(code, message, details) {
  let err = new Error(message);
  //@ts-ignore
  err.code = code;
  //@ts-ignore
  err.details = details;
  return err;
}

function newExposedKeyError() {
  let histfile = "your Shell history";
  if (process.env.HISTFILE) {
    histfile = process.env.HISTFILE;
  }
  return newError(
    "E_EXPOSED_KEY",
    `You've exposed your private key, which may have been written to ${histfile}.`,
  );
}

main()
  .then(async function () {
    process.exit(0);
  })
  .catch(function (err) {
    if ("E_BAD_INPUT" === err.code) {
      console.error("Error:");
      console.error();
      console.error(err.message);
      console.error();

      process.exit(1);
      return;
    }

    if ("E_EXPOSED_KEY" === err.code) {
      console.error("Security Error:");
      console.error();
      console.error(err.message);
      console.error(`Use --unsafe to run anyway.`);
      console.error();

      process.exit(1);
      return;
    }

    console.error("Fail:");
    console.error(err.stack || err);

    process.exit(1);
  });
