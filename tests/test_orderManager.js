// Script to get the last hour of trades and
// run candleManager on them for testing.

AUTOBAHN_DEBUG = true;

const Util = require('../lib/util')
const colors = require('colors')
const autobahn = require('autobahn')
const wsuri = "wss://api.poloniex.com"
const assert = require('assert')

const Poloniex = require('../lib/poloniex')

// Create a new instance, we don't need a real API key or secret for testing
const poloniex = new Poloniex( null, null, false )

// * IMPORTANT *
// The line below is temporary, to avoid API server certficiate failure `Error: CERT_UNTRUSTED`
// This is presumably a temporary issue and has been reported to Poloniex.
// Do not include the line below once the issue is resolved.
Poloniex.STRICT_SSL = false;

// TRADER POLICY
// All the behavior and parameters specified below are trader
// behavior, and should be moved into its own module eventually.

const OrderManager = require('../lib/orderManager')
const orderManager = new OrderManager({
    currencyOut: 'BTC',
    currencyIn: 'ETH',
    poloniex: poloniex,
    minDist: 10000})

orderManager.buy(0.01, 1, 60*60*4);
// Introduce a delay, Poloniex seems to require 1000 ms btw nonces
setTimeout(function() {
  orderManager.sell(0.02, 1, 60*60*4);
},1000);
