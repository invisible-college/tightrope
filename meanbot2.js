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
  exit();
}

var configFile = process.argv[2];
var currencyOut = process.argv[3] || "BTC";
var currencyIn = process.argv[4] || "ETH";
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

var Poloniex = require('./lib/poloniex'),
    // When using as an NPM module, use `require('poloniex.js')`

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

var CandleManager = require('./candleManager');

// To match Poloniex's default of 50 SMA for 5-minute periods,
// we keep 250 SMA for 1-minute periods.
// Min-max period of 4 hours (60*4 1 minute periods)
var candleManager = new CandleManager({
  maxCandles: 250, emaPeriod: 150, minMaxPeriod: 60*4});

var company = {poloniex: poloniex, connection: connection};

var OrderBook = require('./orderBook');
var orderBook = new OrderBook(currencyOut, currencyIn, company, candleManager);

// TRADER POLICY
// All the behavior and parameters specified below are trader
// behavior, and should be moved into its own module eventually.

var Trade = require('./lib/trade');

// Preload the past 4 hours for min max prices within that window
promise = Trade.loadPastHistory(10, poloniex, candleManager, currencyOut, currencyIn);

promise.then(function(result) {
    orderBook.start();
  }, function(error) {
    console.error("Couldn't start order book.");
  }
);

// 0.01 ETH is about 10 cents, harmless enough to play with
// big enough to be interesting
var betNumber = 1;

var orderCallback = function(err, body) {
  if (err) {
    console.error(err);
  } else {
    console.log(body);
    this.orderNumber = body['orderNumber'];
  }
};

moveMinMax = function(candleManager) {
  var currentMA = candleManager.getSMA();

  var greaterPrice = Util.keyToPrice(candleManager.getMax());
  var lesserPrice = Util.keyToPrice(candleManager.getMin());

  // Shrink them to the PRICE_THRESHOLD centered around their
  // midpoint



  return {
    buyPrice: lesserPrice,
    sellPrice: greaterPrice
  };

};

var OrderManager = require('./orderManager');

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

// We only want to start our intervals after getting lastPrice
// i.e. our first, current trade from the orderBook
orderBook.execute(function() {
  setInterval(function() {
    console.log(new Date());

    results = moveMinMax(candleManager);
    if (!results) {
      return;
    }

    assert(results.buyPrice);
    assert(results.sellPrice);
    assert(results.buyPrice <= results.sellPrice);
    diff = results.sellPrice - results.buyPrice;

    priceFormatter = candleManager.getPriceFormatter();

    console.log("BuyPrice= " + results.buyPrice);
    console.log("SellPrice= " + results.sellPrice);

    modifiedGreaterPrice = results.sellPrice*(1-TAKER_FEE);
    modifiedLesserPrice = results.buyPrice*(1+TAKER_FEE);
    console.log("Modified Greater= " + modifiedGreaterPrice);
    console.log("Modified Lesser= " + modifiedLesserPrice);
    var profit = modifiedGreaterPrice - modifiedLesserPrice;
    console.log("Profit= " + priceFormatter.format(profit));
    console.log("Thresh= " + priceFormatter.format(profitThreshold));

    if (profit < profitThreshold) {
      console.log("Fish too small, throwing it back.");
      return;
    }

    // Center it around their midpoint
    var midPoint = (modifiedGreaterPrice + modifiedLesserPrice) / 2;
    modifiedGreaterPrice = priceFormatter.round(midPoint + (profitThreshold/2));
    modifiedLesserPrice = priceFormatter.round(midPoint - (profitThreshold/2));
    console.log("Recentered Prices= (" + modifiedGreaterPrice + ", " + modifiedLesserPrice +")");

    console.log("\nPlacing Bet Number " + betNumber);
    console.log("Diff= " + priceFormatter.format(diff));

    // Timeout of 4 hours, in seconds
    orderManager.buy(modifiedLesserPrice, betAmount, 60*60*4, timeoutCallback);
    setTimeout(function() {
      orderManager.sell(modifiedGreaterPrice, betAmount, 60*60*4, timeoutCallback);
    },1000);

    betNumber += 1;
  }, INTERVAL_SECONDS * 1000);
});
