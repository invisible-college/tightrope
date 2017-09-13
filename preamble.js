// Premable for trading scripts
// That parses command-line arguments, loads credentials
// and configuration from a file, and exports all the API
// objects to the receiving script.

AUTOBAHN_DEBUG = true;

const Util = require('./lib/util')
const colors = require('colors')
const autobahn = require('autobahn')
const wsuri = "wss://api.poloniex.com"
const assert = require('assert')
const configJson = require('config.json')

if (process.argv.length < 3) {
  console.error("Config.json file with credentials required.")
  process.exit()
}

// Usage:
// meanbot configFile currencyOut currencyIn betAmount live strategy
const configFile = process.argv[2]
// By default we trade BTC and ETH
const currencyOut = process.argv[3] || "BTC"
const currencyIn = process.argv[4] || "ETH"
const betAmount = process.argv[5] || 0.1 // in currencyIn
const live = process.argv[6] || false; // demo mode by default
strategy = process.argv[7] || "moveMinMax"

console.log("Config File= " + configFile)
console.log("CurrencyOut= " + currencyOut)
console.log("CurrencyIn= " + currencyIn)
console.log("BetAmount= " + betAmount)

config = configJson(configFile)

apiKey = config['apiKey']
secret = config['secret']

// Do some basic validation on the key
assert(apiKey.length === 35)
assert(apiKey.split('-').length === 4)
assert(secret.length === 128)

// We don't really print these out for security reasons.
//console.log("API Key= " + apiKey)
//console.log("Secret= " + secret)
console.log("LIVE= " + live)
// Currently 0.22% in the worst case
const TAKER_FEE = 0.0012
//PROFIT_THRESHOLD = 0.01; // in BTC
const INTERVAL_SECONDS = 60
// 0.0001 for BTC_ETH
// 0.0002 for BTC_EXP
// 2 for USDT_BTC
const PROFIT_THRESHOLD = 0.0001 // 0.1 bits

const Poloniex = require('./lib/poloniex')

// Create a new instance, with API key and secret for traderbot1
const poloniex = new Poloniex( apiKey, secret, live )

// * IMPORTANT *
// The line below is temporary, to avoid API server certficiate failure `Error: CERT_UNTRUSTED`
// This is presumably a temporary issue and has been reported to Poloniex.
// Do not include the line below once the issue is resolved.
Poloniex.STRICT_SSL = false;

const connection = new autobahn.Connection({
  url: wsuri,
  realm: "realm1"
})

const CandleManager = require('./lib/candleManager')

// To match Poloniex's default of 50 SMA for 5-minute periods,
// we keep 250 SMA for 1-minute periods,
// and 150 EMA for 1-minute periods
// Min-max period of 4 hours (this can be a parameter that's learned later)
const candleManager = new CandleManager({maxCandles: 250, emaPeriod: 150, minMaxPeriod: 60*4})

const company = {poloniex: poloniex, connection: connection}

const OrderBook = require('./lib/orderBook')
const orderBook = new OrderBook(currencyOut, currencyIn, company, candleManager)

// TRADER POLICY
// All the behavior and parameters specified below are trader
// behavior, and should be moved into its own module eventually.

const Trade = require('./lib/trade')

const OrderManager = require('./lib/orderManager')
const orderManager = new OrderManager({
  currencyOut: currencyOut,
  currencyIn: currencyIn,
  poloniex: poloniex,
  minDist: 10000})

module.exports = {
    candleManager: candleManager,
    poloniex: poloniex,
    company: company,
    orderBook: orderBook,
    orderManager: orderManager,
    Trade: Trade,
    currencyOut: currencyOut,
    currencyIn: currencyIn
};
