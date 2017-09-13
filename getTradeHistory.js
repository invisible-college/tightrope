// Script to get past trades and fresh histories,
// for dumping to a log file
// and testing weathervanes.

// Doesn't use the orderbook at all, so this isn't useful
// for testing ordering strategies.

// For testing stale / previously fetched histories
// use parseTradeHistory.

AUTOBAHN_DEBUG = true;

var colors = require('colors');
var autobahn = require('autobahn');
var wsuri = "wss://api.poloniex.com";
var assert = require('assert');

var Poloniex = require('./lib/poloniex'),
    // When using as an NPM module, use `require('poloniex.js')`

const configJson = require('config.json')
config = configJson(configFile)
apiKey = config['apiKey']
secret = config['secret']

// Create a new instance, with optional API key and secret
poloniex = new Poloniex(apiKey, secret);

// * IMPORTANT *
// The line below is temporary, to avoid API server certficiate failure `Error: CERT_UNTRUSTED`
// This is presumably a temporary issue and has been reported to Poloniex.
// Do not include the line below once the issue is resolved.
Poloniex.STRICT_SSL = false;

var connection = new autobahn.Connection({
  url: wsuri,
  realm: "realm1"
});

// Get command-line parameters
var currencyOut = process.argv[2] || "BTC";
var currencyIn = process.argv[3] || "ETH";
console.log("Out Currency= " + currencyOut);
console.log(" In Currency= " + currencyIn);

var CandleManager = require('./lib/candleManager');

var Malaise = require('./malaise');

var m = new Malaise();
var candleManager = new CandleManager({maxCandles: 50});
candleManager.onNewCandle(m.newCandlestick.bind(m));

bet_amount = 1; // Amount to gamble in each bet, in ETH

m.onSell(function(confidence) {
  console.log("Topping out with confidence " + confidence);
  console.log(bet_amount);
  finalAmount = bet_amount*confidence;
  console.log("Amount " + finalAmount);
});

m.onBuy(function(confidence) {
  console.log("Bottoming out with confidence " + confidence);
  console.log(bet_amount);
  finalAmount = bet_amount*confidence;
  console.log("Amount " + finalAmount);
});

var Trade = require('./lib/trade');

Trade.loadPastHistory(24, poloniex, candleManager, currencyOut, currencyIn);
