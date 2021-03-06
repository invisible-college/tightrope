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

var connection = new autobahn.Connection({
  url: wsuri,
  realm: "realm1"
});

var CandleManager = require('./lib/candleManager');
var Candlestick = require('./lib/candlestick');

// To match Poloniex's default of 50 SMA for 5-minute periods,
// we keep 250 SMA for 1-minute periods.
// Min-max period of 4 hours (60*4 1 minute periods)
var candleManager = new CandleManager({
  maxCandles: 250, emaPeriod: 150, minMaxPeriod: 60*4});

var company = {poloniex: poloniex, connection: connection};

// TRADER POLICY
// All the behavior and parameters specified below are trader
// behavior, and should be moved into its own module eventually.

var Trade = require('./lib/trade');

var inBalance = 0
var outBalance = 0

function setBalances(r) {
    return poloniex.myCompleteBalances(function(err, data) {
        if (err) { console.error(err); }
        r.setInBalance(data[currencyIn]['available']);
        r.setOutBalance(data[currencyOut]['available']);
    });
}

var Rebalance = require('./rebalance')

// Rebalance every 4 5-minute periods (20 minutes) to start with
var r = new Rebalance(4, inBalance, outBalance)
r.onBuy(function(price, amount) {
    poloniex.buy(currencyOut, currencyIn, price, amount, function(err, data) {
        if (err) { console.log('ERROR', err); return; }
        console.log(data);
      });
});

r.onSell(function(price, amount) {
    poloniex.sell(currencyOut, currencyIn, price, amount, function(err, data) {
        if (err) { console.log('ERROR', err); return; }
        console.log(data);
    });
});

candleManager.onNewCandle(r.newCandlestick.bind(r))

heartbeat = function() {
    var now = new Date();
    var seconds = Math.round(now.getTime() / 1000);
    var CANDLE_PERIOD=INTERVAL_SECONDS;
    console.log(now);
    var data = poloniex.getChartData(currencyOut, currencyIn, function(err, data) {
       if (err) { console.log('ERROR', err); return; }
       console.log(data);
       assert(data.length > 0);
       candle = data[data.length-1];
       assert(candle.weightedAverage > 0);
       assert(candle.volume > 0);
       // Set balances before rebalancing
       setBalances(r).then(function() {
           r.newCandlestick(new Candlestick(
                       candle.weightedAverage,
                       candle.volume,
                       priceFormatter, now.getHours()+":"+now.getMinutes()));
           });
    }, seconds - 4*INTERVAL_SECONDS, seconds, CANDLE_PERIOD);
    console.log(JSON.stringify(data));
}


// We only want to start our intervals after getting lastPrice
// i.e. our first, current trade from the orderBook

// Run the heartbeat once at the very beginning
heartbeat()

setInterval(heartbeat, INTERVAL_SECONDS*1000);

setInterval(function() {
    console.log(new Date());
}, 20*1000);
