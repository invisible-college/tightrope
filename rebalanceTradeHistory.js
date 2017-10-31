// Script to get past trades and fresh histories,
// for dumping to a log file
// and testing weathervanes.

// Doesn't use the orderbook at all, so this isn't useful
// for testing ordering strategies.
// For testing stale / previously fetched histories
// use parseTradeHistory.

AUTOBAHN_DEBUG = true

var colors = require('colors')
var autobahn = require('autobahn')
var wsuri = "wss://api.poloniex.com"
var assert = require('assert')

var Poloniex = require('./lib/poloniex')
// When using as an NPM module, use `require('poloniex.js')` 
const configJson = require('config.json')
config = configJson("creds-traderbot1.json")
apiKey = config['apiKey']
secret = config['secret']


// Create a new instance, with optional API key and secret
poloniex = new Poloniex(apiKey, secret)

// * IMPORTANT *
// The line below is temporary, to avoid API server certficiate failure `Error: CERT_UNTRUSTED`
// This is presumably a temporary issue and has been reported to Poloniex.
// Do not include the line below once the issue is resolved.
Poloniex.STRICT_SSL = false

var connection = new autobahn.Connection({
  url: wsuri,
  realm: "realm1"
})

// Get command-line parameters
var currencyOut = process.argv[2] || "BTC"
var currencyIn = process.argv[3] || "ETH"
// Rebalance every 4 candles by default
var intervalCandles = Number(process.argv[4]) || 4 
// Candle seconds
var candleSeconds = Number(process.argv[5]) || 300
var startOffsetS = Number(process.argv[6]) || 86400 // offset into the past
var endEpochS = Number(process.argv[7]) || 9999999999
console.log("Out Currency= " + currencyOut)
console.log(" In Currency= " + currencyIn)
console.log(`Rebalance Frequency = ${intervalCandles} candles`)
console.log(`Candle Period = ${candleSeconds}`)
console.log(`Start Offset Seconds = ${startOffsetS}`)
console.log(`End Epoch Seconds = ${endEpochS}`)

var CandleManager = require('./lib/candleManager')

var Rebalance = require('./rebalance')

var r = new Rebalance(intervalCandles, 50, 50)
var candleManager = new CandleManager({maxCandles: 50})
candleManager.onNewCandle(r.newCandlestick.bind(r))

r.setInBalance(50);
r.setOutBalance(50);

poloniex.getChartData(currencyOut, currencyIn, function(err, data) {
	if (err) { console.log('ERROR', err); return; }
	console.log(`Retrieved ${data.length} candles`);
	console.log(JSON.stringify(data));
	assert(data.length > 0);
	data.forEach((candle) => {
        var t = new Date(candle.date);
		assert(candle.weightedAverage > 0);
		assert(candle.volume > 0);
		r.newCandlestick(new Candlestick(
			   candle.weightedAverage,
			   candle.volume,
			   priceFormatter, t.getHours()+":"+t.getMinutes()));
	   });
   }, startOffsetS, endEpochS, candleSeconds);
