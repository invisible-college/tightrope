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
var currency = process.argv[3] || "";

console.log("Config File= " + configFile);
console.log("CurrencyOut= " + currency);

config = configJson(configFile);

apiKey = config['apiKey'];
secret = config['secret'];

assert(apiKey.length === 35);
assert(apiKey.split('-').length === 4);
assert(secret.length === 128);

console.log("API Key= valid");
console.log("Secret= valid");

var Poloniex = require('./lib/poloniex')

// Create a new instance, with API key and secret for traderbot1
poloniex = new Poloniex( apiKey, secret, false );

// * IMPORTANT *
// The line below is temporary, to avoid API server certficiate failure `Error: CERT_UNTRUSTED`
// This is presumably a temporary issue and has been reported to Poloniex.
// Do not include the line below once the issue is resolved.
Poloniex.STRICT_SSL = false;

var prices = {};

poloniex.generateNewAddress(currency, function(err, data) {
    if (err) { console.error(err); return; }
    console.log(JSON.stringify(data));
});
