// Tests the parsing of trade history and CandleManager
// functionality with real live data.
// Most similar to parseTradeHistory.js, but without statebus stuff

var fs = require('fs');
var assert = require('assert');
var Order = require('../order');
var Test = require('../lib/test');

var filename = "tradeHistory.log";
console.log("Opening file " + filename);

var listJoin = function(list, start, end) {
  var results = [];
  for (var i=start; i < end; i++) {
    results.push(list[i]);
  }
  return results.join(' ');
};

var CandleManager = require('../candleManager');
var Malaise = require('../malaise');
var m = new Malaise();
var candleManager = new CandleManager(50);

// Keep both a list and an object keyed by candle name
// for ease of testing
var candles = {};
var candleList = [];
var candleCount = 0;

var isEverCalled = false;

candleManager.onNewCandle(function(newCandle) {
  isEverCalled = true;
  candleList.push(newCandle);
  candles[newCandle.name] = newCandle;
  candleCount += 1;
  newCandle.print();
});

var promise = new Promise(function(fulfill, reject) {
  fs.readFile(filename, function(err, data) {
    if (err) {
      reject(err);
    } else {
      fulfill(data);
    }
  });
});

promise.then(function(res) {
  //console.log(data.toString());
  var lines = res.toString().split('\n');
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
      var order = new Order(tokens[7], tokens[5], dateString, tokens[3]);
      //order.print();
      candleManager.orderHandler(order);
    }
  }
}).then(function() {
  assert(isEverCalled); // Make sure our registered callback is ever called

  // I calculated these values by hand from tradeHistory.log
  assert(candleCount === 1445);
  assert(candleList[0].tradeCount === 30);
  var candle0955 = candles["9:55"];
  assert(candle0955);
  Test.assertApprox(candle0955.open, 0.02855597);
  Test.assertApprox(candle0955.close, 0.02856299);
  Test.assertApprox(candle0955.weightedAvg, 10.71984675);
});
