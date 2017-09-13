// Test subscribing to new trades from the Push API
// and processing them, namely for BTC_ETH

var colors = require('colors');
var autobahn = require('autobahn');
//var bus = require('statebus-server');
var wsuri = "wss://api.poloniex.com";

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

function sendMessage(msg) {
  var child;
  child = exec("/home/ubuntu/venv/slack/bin/python slacktest.py '" + msg + "'",
    function (error, stdout, stderr) {
      if (error !== null) {
        console.log('exec error: ' + error);
      }
    });
}

var CandleManager = require('./candleManager');
var Direction = require('./direction');

var StateMachine = require('./stateMachine');

var m = StateMachine();
var direction = Direction(3, m);
var candleManager = new CandleManager(direction);

m.onTopOut(function() {
  console.log("Topping out, sell at ");
  console.log(JSON.stringify(candleManager));
  console.log(candleManager.lastPrice);
});

m.onBottomOut(function() {
  console.log("Bottoming out, buy at ");
  console.log(JSON.stringify(candleManager));
  console.log(candleManager.lastPrice);
});

m.onRising(function() {
  console.log("Rising");
});

m.onFalling(function() {
  console.log("Falling");
});

m.onNeutral(function() {
  console.log("Neutral");
});

var btcEthEvent = function(args, kwargs) {
  //console.log(args);

  for (var i in args) {
    var item = args[i];
    var data = item['data'];
    var eventType = item['type'];

    // We assume all event types have a subtype in their data
    var type = data['type'];

    if (eventType === "newTrade") {
      tradeID = data['tradeID'];
      price = parseFloat(data['rate']);
      amount = parseFloat(data['amount']);
      date = data['date'];
      total = data['total'];
      try {
        candleManager.minuteHandler(price, amount);
      } catch (e) {
        console.error("candleManager.minuteHandler " + e);
      }
      console.log("New Trade ID: " + tradeID + " " + type + " of " + amount + " @ " + rate + " for a total of " + total + " on " + date);
    }
  }
};

connection.onopen = function (session) {
  console.log("Started up");
  session.subscribe("BTC_ETH", btcEthEvent);
};

connection.open();
