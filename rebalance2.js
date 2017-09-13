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
var currencyOut = process.argv[3] || "USDT";
var currencyIn = process.argv[4] || "ETC";
var betAmount = process.argv[5] || 0.1;
var profitThreshold = process.argv[6] || 0.0005;
var live = process.argv[7] || false; // demo mode by default

console.log("Config File= " + configFile);
console.log("CurrencyOut= " + currencyOut);
console.log("CurrencyIn= " + currencyIn);
console.log("BetAmount= " + betAmount);
console.log("Profit Threshold= " + profitThreshold);

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
INTERVAL_SECONDS = 60;
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

var connection = new autobahn.Connection({
  url: wsuri,
  realm: "realm1"
});

var CandleManager = require('./lib/candleManager');

// To match Poloniex's default of 50 SMA for 5-minute periods,
// we keep 250 SMA for 1-minute periods.
// Min-max period of 4 hours (60*4 1 minute periods)
var candleManager = new CandleManager({
  maxCandles: 250, emaPeriod: 150, minMaxPeriod: 60*4});

var company = {poloniex: poloniex, connection: connection};

var OrderBook = require('./lib/orderBook');
var orderBook = new OrderBook(currencyOut, currencyIn, company, candleManager);

// TRADER POLICY
// All the behavior and parameters specified below are trader
// behavior, and should be moved into its own module eventually.

var Trade = require('./lib/trade');

orderBook.start();

var orderCallback = function(err, body) {
  if (err) {
    console.error(err);
  } else {
    console.log(body);
    this.orderNumber = body['orderNumber'];
  }
};

var ETC_balance = 0
var USDT_balance = 0

function setBalances(r) {
    poloniex.myCompleteBalances(function(err, data) {
        if (err) { console.error(err); }
        r.setInBalance(data['ETC']['available']);
        r.setOutBalance(data['USDT']['available']);
    });
}

var OrderManager = require('./lib/orderManager');

// minDist between keys given in satoshis
var orderManager = new OrderManager({currencyOut: currencyOut,
  currencyIn: currencyIn, poloniex: poloniex, minDist: 10000});

function timeoutCallback(order) {
  // if an order times out, cancel it for now
  // moving it is more complicated, and not known to be better
  orderManager.cancel(order);
  /*
  if (order.type === 'buy') {
    orderManager.move(order, candleManager.getMin());
  } else if (order.type === 'sell') {
    orderManager.move(order, candleManager.getMax());
  }
  */
}

var Rebalance = require('./rebalance')

// Rebalance every two minutes to start with
var r = new Rebalance(2, ETC_balance, USDT_balance)
r.onBuy(function(price, amount) {
    poloniex.buy('USDT', 'ETC', price, amount, function(err, data) {
        if (err) { console.log('ERROR', err); return; }
        console.log(data);
      });
});

r.onSell(function(price, amount) {
    poloniex.sell('USDT', 'ETC', price, amount, function(err, data) {
        if (err) { console.log('ERROR', err); return; }
        console.log(data);
    });
});

candleManager.onNewCandle(r.newCandlestick.bind(r))

// We only want to start our intervals after getting lastPrice
// i.e. our first, current trade from the orderBook
orderBook.execute(function() {
  setInterval(function() {
    console.log(new Date());

    setBalances(r);

  }, INTERVAL_SECONDS * 1000);
});
