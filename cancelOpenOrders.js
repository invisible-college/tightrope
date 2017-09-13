// Script to get the last hour of trades and
// run candleManager on them for testing.

AUTOBAHN_DEBUG = true;

const Util = require('./lib/util')
const colors = require('colors')
const autobahn = require('autobahn')
const wsuri = "wss://api.poloniex.com"
const assert = require('assert')
const configJson = require('config.json') 
if (process.argv.length < 3) {
  console.error("Config.json file with credentials required.")
  process.exit()
}

// Usage:
// meanbot configFile currencyOut currencyIn betAmount live strategy
const configFile = process.argv[2]
// By default we trade BTC and ETH
const currencyOut = process.argv[3] || "BTC"
const currencyIn = process.argv[4] || "ETH"

console.log("Config File= " + configFile)
console.log("CurrencyOut= " + currencyOut)
console.log("CurrencyIn= " + currencyIn)

config = configJson(configFile)

apiKey = config['apiKey']
secret = config['secret']

// Do some basic validation on the key
assert(apiKey.length === 35)
assert(apiKey.split('-').length === 4)
assert(secret.length === 128)

const Poloniex = require('./lib/poloniex')

// Create a new instance, with API key and secret for traderbot1
const poloniex = new Poloniex( apiKey, secret, true )

// * IMPORTANT *
// The line below is temporary, to avoid API server certficiate failure `Error: CERT_UNTRUSTED`
// This is presumably a temporary issue and has been reported to Poloniex.
// Do not include the line below once the issue is resolved.
Poloniex.STRICT_SSL = false;

orders = []

openOrders = poloniex.myOpenOrders(currencyOut, currencyIn,
        function(err, data) {
    if (err) { console.error(err); return }
    // Cancel all open orders
    timeout = 1000;
    console.log(typeof(data))
    data.forEach((item) => {
        setTimeout(() => {
            poloniex.cancelOrder(currencyOut, currencyIn, item['orderNumber'], function(err, data) {
            if (err) { console.error(err); return; }
            console.log(JSON.stringify(data));
        });
        }, timeout);
        timeout += 1000;
    });
});
//console.log("returned = " + JSON.stringify(openOrders));
