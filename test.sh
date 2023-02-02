#!/bin/sh
set -e
set -u

set -x
./bin/dashkeys.js help

./bin/dashkeys.js address --json --unsafe 'XCGKuZcKDjNhx8DaNKK4xwMMNzspaoToT6CafJAbBfQTi57buhLK'
./bin/dashkeys.js address --json ./examples/XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9.wif
./bin/dashkeys.js address ./examples/XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9.wif

./bin/dashkeys.js inspect --json --unmask ./examples/XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9.wif
./bin/dashkeys.js inspect ./examples/XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9.wif

./bin/dashkeys.js verify --json ./examples/XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9.wif
./bin/dashkeys.js verify ./examples/XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9.wif
./bin/dashkeys.js verify 'XrZJJfEKRNobcuwWKTD3bDu8ou7XSWPbc9'

./bin/dashkeys.js generate
set +x

echo '

Probably PASSed
(check output above for errors)

'
