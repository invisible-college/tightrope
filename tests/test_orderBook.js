// Test the orderBook

var colors = require('colors');
var autobahn = require('autobahn');
//var bus = require('statebus-server');
var wsuri = "wss://api.poloniex.com";

var OrderBook = require('../orderBook');

var Poloniex = require('../lib/poloniex'),
    // When using as an NPM module, use `require('poloniex.js')`

    // Create a new instance, with optional API key and secret
    poloniex = new Poloniex(
        "90XTIERJ-7SE2CRYV-PTWPT47T-28GSSAFS",
        "33a116477ddd6f9d77310d4ac4cd4c7ca6fe98bf8dfef6942c9bb07b27cf111bcf13be5c37ea0a4a2a7345ec3f936c579c0f9fad20e821cb41c175b0050df41d"
    );


// * IMPORTANT *
// The line below is temporary, to avoid API server certficiate failure `Error: CERT_UNTRUSTED`
// This is presumably a temporary issue and has been reported to Poloniex.
// Do not include the line below once the issue is resolved.
Poloniex.STRICT_SSL = false;

var connection = new autobahn.Connection({
  url: wsuri,
  realm: "realm1"
});

var company = {poloniex: poloniex, connection: connection};

var orderBook = new OrderBook("BTC", "ETH", company);
orderBook.start();
