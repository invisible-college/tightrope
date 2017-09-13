// Test subscribing to new trades from the Push API
// and processing them, namely for BTC_ETH

var colors = require('colors');
var autobahn = require('autobahn');
//var bus = require('statebus-server');
var wsuri = "wss://api.poloniex.com";
var fs = require('fs');
var exec = require('child_process').exec;
var logger = require('./lib/logger')('Trade', true)

function getTimeString() {
  var now = new Date();
  return now.getHours() + ":" + now.getMinutes();
}

var Poloniex = require('./lib/poloniex');
// When using as an NPM module, use `require('poloniex.js')`

// Create a new instance, with optional API key and secret
poloniex = new Poloniex(apiKey, secret);

// * IMPORTANT *
// The line below is temporary, to avoid API server certficiate failure `Error: CERT_UNTRUSTED`
// This is presumably a temporary issue and has been reported to Poloniex.
// Do not include the line below once the issue is resolved.
Poloniex.STRICT_SSL = false;

/*
var RtmClient = require('./lib/clients/rtm/client');
var RTM_EVENTS = require('./lib/clients/events/rtm').EVENTS;

var token = process.env.SLACK_API_TOKEN || '';
logger.info("Token = " + token);

var rtm = new RtmClient(token, { logLevel: 'dbug' });
rtm.start();


rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  logger.info("Message:", message);
});
*/
var connection = new autobahn.Connection({
  url: wsuri,
  realm: "realm1"
});

// Arbitrage, do it between ETH, BTC, USDT
// First, find the rate between ETH/BTC
// Second, find the rate between USDT/ETH
// Third, find the rate between USDT/BTC

// Ideally, if we change 1.0 from BTC to ETH to USD to BTC,
// instantaneously, we should get back (1 - 0.02)**3.
// if we get back a greater number, arbitrage profit!
// if we get back a smaller number, no profit. don't do it

// 1. 0.02803007 BTC/ETH
// 2. 1/11.59787495 ETH/USDT
// 3. 405.81040501 USDT/BTC

// We make a candlestick period of 1 minute

function sendMessage(msg) {
  var child;
  child = exec("/home/ubuntu/venv/slack/bin/python slacktest.py '" + msg + "'",
    function (error, stdout, stderr) {
      if (error !== null) {
        logger.info('exec error: ' + error);
      }
    });
}

var CandleManager = require('./candleManager');
var Direction = require('./direction');

var StateMachine = require('./stateMachine');
var m = StateMachine();

m.onTopOut(function() {
  logger.info("Topping out, sell at " + lastPrice);
});

m.onBottomOut(function() {
  logger.info("Bottoming out, buy at " + lastPrice);
});

m.onRising(function() {
  logger.info("Rising");
});

m.onFalling(function() {
  logger.info("Falling");
});

var direction = Direction(3, m);
var candleManager = new CandleManager(direction);

// Test the orderBook

var OrderBook = require('./orderBook');

var company = {poloniex: poloniex, connection: connection};

var orderBook = new OrderBook("BTC", "ETH", company, candleManager);
orderBook.start();
