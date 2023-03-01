# [dashkeys-cli](https://github.com/dashhive/dashkeys-cli)

CLI **Reference Tools** for converting and validating DASH Private Keys and
Payment Addresses

## Features

- [x] Validate Base58Check addresses
  - WIF (**W**allet **I**mport **F**ormat for Private Keys)
  - PayAddr
- [x] WIF to Addr
- [x] Addr (Base58Check) to PubKeyHash (PKH)
- [x] Output as text or JSON
- [x] API

See [Dash HD][dash-hd-cli] for Extended Private Key (`xprv`) and Extended Public
Key (`xpub`) features.

[dashkeys-js]: https://github.com/dashhive/dashkeys.js

## Install

1. Install [node.js](https://webinstall.dev/node)
   ```sh
   # Mac, Linux
   curl -sS https://webi.sh/node | sh
   ```
   ```pwsh
   # Windows 10+
   curl.exe https://webi.ms/node | powershell
   ```
2. Install `dashkeys-cli` via `npm`
   ```sh
   npm install --location=global dashkeys-cli
   ```

## Usage

See `dashkeys help` for the most up-to-date info:

```sh
dashkkeys help
```

```text

Usage:
    dashkeys address <./file.wif>    convert WIF to Pay Addr
    dashkeys generate                create WIF [DEV TOOL]
    dashkeys inspect <addr-or-file>  decode base58check
    dashkeys verify <addr-or-file>   validate checksum

    dashkeys help     show this menu
    dashkeys version  show version

Global Flags:
    --json             machine-friendly json to stdout
    --unsafe           no private key mask, accept as string

```

### Convert WIF to Payment Address

From a file:

```sh
# File contents: XCGKuZcKDjNhx8DaNKK4xwMMNzspaoToT6CafJAbBfQTi57buhLK
dashkeys address ./XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9.wif
```

```text
Pay Addr is XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9
```

From a string (**unsafe**), as JSON:

```sh
dashkeys address --json --unsafe 'XCGKuZcKDjNhx8DaNKK4xwMMNzspaoToT6CafJAbBfQTi57buhLK'
```

```json
{
  "address": "XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9"
}
```

### Verify an Addr (string) or WIF (file)

Verify a PubKeyHash:

```sh
dashkeys verify 'XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9'
```

```text
Pay Addr string is valid
(Pub Key Hash: ae14c8728915b492d9d77813bd8fddd91ce70948)
```

Verify a WIF file:

```sh
# File contents: XCGKuZcKDjNhx8DaNKK4xwMMNzspaoToT6CafJAbBfQTi57buhLK
dashkeys verify ./XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9.wif
```

```text
Private Key file valid
```

### Inspect a Key

Inspect a PubKeyHash (as json):

```sh
dashkeys inspect --json 'XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9'
```

```json
{
  "valid": true,
  "version": "4c",
  "pubKeyHash": "ae14c8728915b492d9d77813bd8fddd91ce70948",
  "check": "ce08541e",
  "compressed": true
}
```

Inspect a WIF (masked):

```sh
# File contents: XCGKuZcKDjNhx8DaNKK4xwMMNzspaoToT6CafJAbBfQTi57buhLK
dashkeys inspect --json ./XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9.wif
```

```json
{
  "address": "XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9",
  "valid": true,
  "version": "cc",
  "privateKey": "1d************************************************************50",
  "compressed": true,
  "check": "ec533f80",
  "publicKey": "0245ddd5edaa25313bb88ee0abd359f6f58ac38ed597d33a981f1799903633d902",
  "pubKeyHash": "ae14c8728915b492d9d77813bd8fddd91ce70948",
  "pubKeySha256": "8e5abfc42a6d7529b860ce2b4b8889380db893438dc96430f597ddb455e85fdd"
}
```

Inspect a WIF (unmasked):

```sh
# File contents: XCGKuZcKDjNhx8DaNKK4xwMMNzspaoToT6CafJAbBfQTi57buhLK
dashkeys inspect --json --unmask ./XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9.wif
```

```json
{
  "address": "XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9",
  "valid": true,
  "version": "cc",
  "privateKey": "1d2a6b22fcb5a29a5357eaf27b1444c623e5e580b66ac5f1109e2778a0ffb950",
  "compressed": true,
  "check": "ec533f80",
  "publicKey": "0245ddd5edaa25313bb88ee0abd359f6f58ac38ed597d33a981f1799903633d902",
  "pubKeyHash": "ae14c8728915b492d9d77813bd8fddd91ce70948",
  "pubKeySha256": "8e5abfc42a6d7529b860ce2b4b8889380db893438dc96430f597ddb455e85fdd"
}
```

**note**: the `_xy*` debug fields show _incorrect_ values that are common
mistakes - to help those developing their own PubKeyHash or Base58Check key
library in other languages.

### Generate a Key

**Note**: This is just for **DEVELOPMENT**. Generally speaking, you should use
generate recoverable keys using [Dash Wallet][dash-wallet-cli] or [Dash
HD][dash-hd-cli] instead.

<small>(there's **nothing wrong** with these keys - they're **fully tested**,
they're just not HD keys)</small>

```sh
dashkeys generate
```

```text
Saved new private key to './XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9.wif'
```

The name of the file is the Pay Addr (Base58Check-encoded Public Key Hash) and
the contents are the WIF (private key).

The leading `X` for each is because they are base58check-encoded.

[dash-wallet-cli]: https://github.com/dashhive/dashwallet-cli
[dash-hd-cli]: https://github.com/dashhive/dashhd-cli

## API

See [DashKeys.js][dashkeys-js].

## Fixtures

For troubleshooting, debugging, etc, the keys used in this example come from the
canonical Dash "Zoomonic":

```text
Passphrase (Mnemonic)  :  zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong
Secret (Salt Password) :  TREZOR
HD Path                :  m/44'/5'/0'/0/0:
WIF                    :  XCGKuZcKDjNhx8DaNKK4xwMMNzspaoToT6CafJAbBfQTi57buhLK
Addr                   :  XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9
```

### Correct PubKeyHash Values

```sh
dashkeys inspect --unmask ./examples/m44_5_0_0-0.wif
```

```text
    Version:     cc
    Private Key: 1d2a6b22fcb5a29a5357eaf27b1444c623e5e580b66ac5f1109e2778a0ffb950
    Compressed:  01
    Pay Addr:    XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9
    Check:       ec533f80
    Valid:       true
```

**Private Key** (Debug Info):

```text
PrivateKey:   cc011d2a6b22fcb5a29a5357eaf27b1444c623e5e580b66ac5f1109e2778a0ffb950
  --------
  Version:    cc
  Comp Flag:  01 (Compressed)
  Priv Key:   1d2a6b22fcb5a29a5357eaf27b1444c623e5e580b66ac5f1109e2778a0ffb950
  --------
WIF:          XCGKuZcKDjNhx8DaNKK4xwMMNzspaoToT6CafJAbBfQTi57buhLK
```

**Public Key Hash** (Debug Info):

```text
PubKey:       0245ddd5edaa25313bb88ee0abd359f6f58ac38ed597d33a981f1799903633d902
  --------
  Comp Flag:  02 (Quadrant 2)
  X:          45ddd5edaa25313bb88ee0abd359f6f58ac38ed597d33a981f1799903633d902
  SHA256:     8e5abfc42a6d7529b860ce2b4b8889380db893438dc96430f597ddb455e85fdd
  *RMD160:    54408a877b83cb9706373918a430728f72f3d001 (*not used)
  PubKeyHash: ae14c8728915b492d9d77813bd8fddd91ce70948
  Check:      ce08541e
  Version:    4c
  --------
Pay Address:    XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9
```

# LICENSE

Copyright (c) 2023 Dash Incubator \
Copyright (c) 2023 AJ ONeal

MIT License
