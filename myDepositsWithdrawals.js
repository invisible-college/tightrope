// Script to get the last hour of trades and
// run candleManager on them for testing.

AUTOBAHN_DEBUG = true;

var colors = require('colors');
var autobahn = require('autobahn');
var wsuri = "wss://api.poloniex.com";
var assert = require('assert');
var configJson = require('config.json');

var Util = require('./lib/util');

if (process.argv.length < 3) {
  console.error("Config.json file with credentials required.");
  process.exit();
}

var configFile = process.argv[2];
var currencyOut = process.argv[3] || "BTC";
var currencyIn = process.argv[4] || "ETH";
var live = process.argv[5] || false; // demo mode by default

console.log("Config File= " + configFile);
console.log("CurrencyOut= " + currencyOut);
console.log("CurrencyIn= " + currencyIn);

config = configJson(configFile);

apiKey = config['apiKey'];
secret = config['secret'];

assert(apiKey.length === 35);
assert(apiKey.split('-').length === 4);
assert(secret.length === 128);

console.log("API Key= valid");
console.log("Secret= valid");
console.log("LIVE= " + live);
// Currently 0.22% in the worst case
TAKER_FEE = 0.0025;
//PROFIT_THRESHOLD = 0.01; // in BTC
INTERVAL_SECONDS = 300;
// 0.0001 for BTC_ETH
// 0.0002 for BTC_EXP
// 2 for USDT_BTC
//PROFIT_THRESHOLD = 0.0005; // 0.5 bits for ETH
//PROFIT_THRESHOLD = 0.0005;

var Poloniex = require('./lib/poloniex')

// Create a new instance, with API key and secret for traderbot1
poloniex = new Poloniex( apiKey, secret, live );

// * IMPORTANT *
// The line below is temporary, to avoid API server certficiate failure `Error: CERT_UNTRUSTED`
// This is presumably a temporary issue and has been reported to Poloniex.
// Do not include the line below once the issue is resolved.
Poloniex.STRICT_SSL = false;

now = new Date().getTime() / 1000;

return poloniex.myDepositsWithdrawals(now - 86400000, now, function(err, data) {
    if (err) { console.error(err); }
    console.log(JSON.stringify(data));
});
