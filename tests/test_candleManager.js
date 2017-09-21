var StateMachine = require('../stateMachine');
var Test = require('../lib/test');
var Util = require('../lib/util');

var m = StateMachine();

m.onTopOut(function() {
  console.log("Topping out, sell at " + candleManager.lastPrice);
});

m.onBottomOut(function() {
  console.log("Bottoming out, buy at " + candleManager.lastPrice);
});

m.onRising(function(candleManager) {
  console.log("Rising");
});

m.onFalling(function(candleManager) {
  console.log("Falling");
});

var direction = require('../direction')(3,m);

NUM_CANDLES = 5;
// We want the min-max period to be short enough that 900 randomly timed events
// will max out that number of candles.
MIN_MAX_PERIOD = 20;

const CandleManager = require('../lib/candleManager')
const candleManager = new CandleManager({maxCandles: NUM_CANDLES, emaPeriod: 150, minMaxPeriod: MIN_MAX_PERIOD})

var candleList = [];
var ourMinKeyList = [];
var ourMaxKeyList = [];

candleManager.onNewCandle(function(newCandle, cm) {
  direction.newCandlestick(newCandle);
  candleList.push(newCandle);

  ourMinKeyList.push(Util.priceToKey(newCandle.low));
  ourMaxKeyList.push(Util.priceToKey(newCandle.high));

  var total = 0;
  var diff = candleList.length - NUM_CANDLES;
  var num = diff >= 0 ? NUM_CANDLES : candleList.length;
  for (var i = Math.max(diff, 0); i < candleList.length; i++) {
    console.log("i= " + i);
    total += candleList[i].getCenter();
  }
  var currentMin = Infinity;
  var currentMax = 0;
  for (var i = candleList.length > MIN_MAX_PERIOD ? candleList.length - MIN_MAX_PERIOD : 0; i < candleList.length; i++) {
    lowKey = Util.priceToKey(candleList[i].low);
    highKey = Util.priceToKey(candleList[i].high);
    currentMin = Math.min(lowKey, currentMin)
    currentMax = Math.max(highKey, currentMax)
  }
  var computedMA = total / num;
  Test.assertApprox(candleManager.getSMA(), computedMA);
  console.log(candleManager.minBottom.toString())
  console.log(candleManager.maxTop.toString())
  Test.assertEquals(candleManager.getMin(), Util.keyToPrice(currentMin))
  Test.assertEquals(candleManager.getMax(), Util.keyToPrice(currentMax))
});

//var suspend = require('suspend');
var sleep = require('sleep');

var now = new Date();
var startStamp = now.getTime();
console.log("Starting at " + startStamp + " which is " + now);

for (var i = 0; i < 900; i++) {
  console.log(i);
  var increment = parseInt(Math.random()*5000); // increment is in milliseconds
  startStamp += increment;
  price = Math.random();
  vol = Math.random();
  candleManager.minuteHandler(price, vol, new Date(startStamp));
}

Test.assertEquals(MIN_MAX_PERIOD, candleManager.minBottom.nodes.length);
Test.assertEquals(MIN_MAX_PERIOD, candleManager.maxTop.nodes.length);

console.log(candleManager.getSMA());
console.log(candleManager.getEMA());
/*
suspend(function* () {
    console.log('Welcome to My Console,');
      yield setTimeout(suspend.resume(), Math.random()*100); // 10 seconds pass..
      candleManager.minuteHandler(Math.random(), Math.random());
      yield setTimeout(suspend.resume(), Math.random()*100); // 10 seconds pass..
      candleManager.minuteHandler(Math.random(), Math.random());
      yield setTimeout(suspend.resume(), Math.random()*100); // 10 seconds pass..
      candleManager.minuteHandler(Math.random(), Math.random());
      yield setTimeout(suspend.resume(), Math.random()*100); // 10 seconds pass..
      candleManager.minuteHandler(Math.random(), Math.random());
      yield setTimeout(suspend.resume(), Math.random()*100); // 10 seconds pass..
      candleManager.minuteHandler(Math.random(), Math.random());
      yield setTimeout(suspend.resume(), Math.random()*100); // 10 seconds pass..
      candleManager.minuteHandler(Math.random(), Math.random());
      yield setTimeout(suspend.resume(), Math.random()*100); // 10 seconds pass..
      candleManager.minuteHandler(Math.random(), Math.random());
      yield setTimeout(suspend.resume(), Math.random()*100); // 10 seconds pass..
      candleManager.minuteHandler(Math.random(), Math.random());
      yield setTimeout(suspend.resume(), Math.random()*100); // 10 seconds pass..
      candleManager.minuteHandler(Math.random(), Math.random());
      yield setTimeout(suspend.resume(), Math.random()*100); // 10 seconds pass..
      candleManager.minuteHandler(Math.random(), Math.random());
})();
*/
