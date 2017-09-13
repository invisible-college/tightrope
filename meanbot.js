// Script to get the last hour of trades and
// run candleManager on them for testing.

var {
  candleManager,
  poloniex,
  company,
  orderBook,
  orderManager,
  Trade,
  currencyOut,
  currencyIn
} = require('./preamble')

const TAKER_FEE = 0.0015
const INTERVAL_SECONDS = 60
// 0.0001 for BTC_ETH
// 0.0002 for BTC_EXP
// 2 for USDT_BTC
const PROFIT_THRESHOLD = 0.0001 // 0.1 bits

// Unpack all preamble members into module namespace
//for (key in preamble) { this[key] = preamble[key] }

// TRADER POLICY
// All the behavior and parameters specified below are trader
// behavior, and should be moved into its own module eventually.

// Preload the past day for the moving average
// Only start the order book after 
promise = Trade.loadPastHistory(24, poloniex, candleManager, currencyOut, currencyIn);
promise.then(
  (result) => { orderBook.start() },
  (error) => { console.error("Couldn't start order book.") }
)
//console.log("50 SMA= " + candleManager.currentSMA);

// 0.01 ETH is about 10 cents, harmless enough to play with
// big enough to be interesting
betNumber = 1

const orderCallback = (err, body) => {
  if (err) { console.error(err) } else {
    console.log(body);
    this.orderNumber = body['orderNumber'];
  }
}

/* STRATEGIES */

// These take in the candleManager
// and output a map of { buyingPrice, sellingPrice }
smaTethered = function(candleManager)   {
  var currentMA = candleManager.getSMA();
  var greaterPrice = Math.max(candleManager.lastPrice, currentMA);
  var lesserPrice = Math.min(candleManager.lastPrice, currentMA);

  var diff = candleManager.lastPrice - candleManager.currentMA;
  if (diff > Util.NOTHING_THRESHOLD) {
    console.log("Above MA by " + diff + ", selling now, buying lower later");
  } else if (diff < Util.NOTHING_THRESHOLD) {
    console.log("Below MA by " + diff + ", buying now, selling higher later");
  }
  // We have different buying and selling prices depending on
  // whether we are above or below thw MA.
  return {
    buyPrice: lesserPrice,
    sellPrice: greaterPrice
  };

};

moveMinMax = (candleManager) => {

  greaterPrice = candleManager.getMax()
  lesserPrice = candleManager.getMin()

  return {
    buyPrice: lesserPrice,
    sellPrice: greaterPrice
  }

}

// Strategy decoding. This is kinda hackey, need a better way.
if (strategy === "moveMinMax") { strategy = moveMinMax }
else { strategy = smaTethered }

timeoutCallback = (order) => { orderManager.cancel(order) }

// We only want to start our intervals after getting lastPrice
// i.e. our first, current trade from the orderBook
orderBook.execute(function() {
  setInterval(function() {
    console.log(new Date());

    results = strategy(candleManager);
    if (!results) {
      return;
    }

    assert(results.buyPrice);
    assert(results.sellPrice);
    assert(results.buyPrice < results.sellPrice);
    diff = results.sellPrice - results.buyPrice;

    priceFormatter = candleManager.getPriceFormatter();

    console.log("BuyPrice= " + results.buyPrice);
    console.log("SellPrice= " + results.sellPrice);

    modifiedGreaterPrice = results.sellPrice*(1-TAKER_FEE);
    modifiedLesserPrice = results.buyPrice*(1+TAKER_FEE);
    console.log("Modified Greater= " + priceFormatter.format(modifiedGreaterPrice));
    console.log("Modified Lesser= " + priceFormatter.format(modifiedLesserPrice));
    var profit = modifiedGreaterPrice - modifiedLesserPrice;
    console.log("Profit= " + priceFormatter.format(profit));
    console.log("Thresh= " + priceFormatter.format(PROFIT_THRESHOLD));

    if (profit < PROFIT_THRESHOLD) {
      console.log("Fish too small, throwing it back.")
      return;
    }

    console.log("\nPlacing Bet Number " + betNumber);
    console.log("Diff= " + priceFormatter.format(diff));

    orderManager.buy(modifiedLesserPrice, betAmount, 60*60*4, timeoutCallback);
    // Introduce a delay, Poloniex seems to require 1000 ms btw nonces
    setTimeout(function() {
      orderManager.sell(modifiedGreaterPrice, betAmount, 60*60*4, timeoutCallback);
    },1000);

    betNumber += 1;
  }, INTERVAL_SECONDS * 1000);
});
