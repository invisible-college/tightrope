var fs = require('fs');
var Order = require('./Order');
var bus = require('./lib/statebus/server')();

bus.serve();

var filename = process.argv[2];
console.log("Opening file " + filename);

var listJoin = function(list, start, end) {
  var results = [];
  for (var i=start; i < end; i++) {
    results.push(list[i]);
  }
  return results.join(' ');
};

var CandleManager = require('./candleManager');
var Malaise = require('./malaise');
var m = new Malaise();
var candleManager = new CandleManager(50);

var candleList = [];

var totalProfit = 0;

candleManager.onNewCandle(function(newCandle, candleManager) {

  candleList.push(newCandle);
  newCandle.print();
  var aboveMA = newCandle.getWeightedAvg() > candleManager.currentSMA;
  var message = aboveMA ? "ABOVE / SELL" : "BELOW / BUY";
  console.log(message);
  console.log("Saving to bus");
  m.newCandlestick(newCandle);

  bus(function() {
    var candles = bus.fetch("/BTC_ETH");
    if (!candles.list) {
      candles.list = []
    }
    candles.list.push(newCandle.stringify());
    bus.save(candles);
  });
});


var PositionChange = require('./positionChange');

var Poloniex = require('./lib/poloniex'),
    // When using as an NPM module, use `require('poloniex.js')`

const configJson = require('config.json')
config = configJson(configFile)
apiKey = config['apiKey']
secret = config['secret']

// Create a new instance, with optional API key and secret
poloniex = new Poloniex(apiKey, secret);

var company = {poloniex: poloniex, connection: undefined};

var OrderBook = require('./orderBook');
var orderBook = new OrderBook("BTC", "ETH", company, candleManager);

// TRADER POLICY
// All the behavior and parameters specified below are trader
// behavior, and should be moved into its own module eventually.

bet_amount = 1; // Amount to gamble in each bet, in ETH
increment = 0.00000001;
limit = 1.0001; // stop chasing the price if we can't catch it in 0.01%

m.onSell(function(confidence) {
  console.log("Topping out with confidence " + confidence);
  console.log(bet_amount);
  finalAmount = bet_amount*confidence;
  console.log("Amount " + finalAmount);
  positionChange = new PositionChange(poloniex, orderBook, "sell",
    finalAmount, increment, limit);
  positionChange.doTheThing();
});

m.onBuy(function(confidence) {
  console.log("Bottoming out with confidence " + confidence);
  console.log(bet_amount);
  finalAmount = bet_amount*confidence;
  console.log("Amount " + finalAmount);
  positionChange = new PositionChange(poloniex, orderBook, "buy",
    finalAmount, increment, limit);
  positionChange.doTheThing();
});

fs.readFile(filename, function(err, data) {
  if (err) {
    console.error(err);
    return;
  }
  //console.log(data.toString());
  var lines = data.toString().split('\n');
  for (var i in lines) {
    if (lines[i].indexOf("New Trade") !== -1) {
      var tokens = lines[i].split(" ");
      var dateString = listJoin(tokens, 14, 20);
      var type = tokens[3];
      //console.log("Type: " + type);
      var volume = parseFloat(tokens[5]);
      var price = parseFloat(tokens[7]);
      //console.log("Volume: " + volume);
      //console.log("Price: " + price);
      //console.log(dateString);
      var date = new Date(dateString);
      //console.log("Date: " + date);
      var order = Order(tokens[7], tokens[5], dateString, tokens[3]);
      //order.print();
      candleManager.orderHandler(order);
    }
  }
});


