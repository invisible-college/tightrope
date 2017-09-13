// Test trading with our new Weathervane, Malaise.

const {
  candleManager,
  poloniex,
  company,
  orderBook,
  orderManager,
  Trade,
  currencyOut,
  currencyIn
} = require('./preamble')
const PositionChange = require('./positionChange')

const Malaise = require('./malaise')

const m = new Malaise()

// TRADER POLICY
// All the behavior and parameters specified below are trader
// behavior, and should be moved into its own module eventually.

bet_amount = 1; // Amount to gamble in each bet, in ETH
increment = 0.00000001;
limit = 1.0001; // stop chasing the price if we can't catch it in 0.01%

candleManager.onNewCandle(function(newCandle, candleManager) {
    console.log("Malaise New Candle");
    m.newCandlestick(newCandle);
})

m.onSell(function(confidence) {
  console.log("Topping out with confidence " + confidence);
  console.log(bet_amount);
  finalAmount = bet_amount*confidence;
  console.log("Amount " + finalAmount);
  /*
  positionChange = new PositionChange(poloniex, orderBook, "sell",
    finalAmount, increment, limit);
  positionChange.doTheThing();
  */
});

m.onBuy(function(confidence) {
  console.log("Bottoming out with confidence " + confidence);
  console.log(bet_amount);
  finalAmount = bet_amount*confidence;
  console.log("Amount " + finalAmount);
  /*
  positionChange = new PositionChange(poloniex, orderBook, "buy",
    finalAmount, increment, limit);
  positionChange.doTheThing();
  */
});

// Kick it off!
orderBook.start();
