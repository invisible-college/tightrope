// A candlestick is a discrete period of trading
// for the purpose of analysis.

const assert = require('assert')
const colors = require('colors')
const PriceFormatter = require('./priceFormatter')
const Logger = require('./logger')
const CandlestickLogger = new Logger('Candlestick', ['info'])

function Candlestick(initPrice, initVol, priceFormatter, name) {

  this.name = name;
  this.high = initPrice;
  this.low = initPrice;
  this.open = initPrice;
  this.close = initPrice;
  this.weightedAvg = initPrice;
  this.vol = initVol;
  this.priceFormatter = priceFormatter || PriceFormatter();
  this.tradeCount = 1;

  this.getSpread = function() {
    return (this.close - this.open);
  };

  this.getAbsSpread = function() {
    return Math.abs(this.close - this.open);
  };

  this.getWeightedAvg = function() {
    return this.weightedAvg;
  };

  this.getCenter = function() {
    return (this.close + this.open) / 2;
  };

  this.getWeightedAvgVol = function() {
    return this.vol * this.weightedAvg;
  };

  this.end = function() {
    CandlestickLogger.info("Closing".blue);
    //this.print();
    if (this.close > this.open) {
      CandlestickLogger.info(this.priceFormatter.format(this.getSpread()).green);
    } else if (this.close < this.open) {
      CandlestickLogger.info(this.priceFormatter.format(this.getSpread()).red);
    } else {
      CandlestickLogger.info("EVEN".yellow);
    }
  };

  // Buy pressure?
  // If we haven't closed yet, return our current weighted avg
  this.isGreen = function() {
    if (this.close === undefined) {
      return this.weightedAvg > this.open;
    } else {
      return this.close > this.open;
    }
  };

  this.isRed = function() {
    return !this.isGreen();
  };

  this.update = function(price, vol) {

    // The last price we update will be the closing price
    this.close = price;

    //CandlestickLogger.info("update " + price + " @ " + vol);
    if (price > this.high) {
      this.high = price;
    }
    if (price < this.low) {
      this.low = price;
    }
    //CandlestickLogger.info("Volume: " + this.vol);
    var prop = vol / (this.vol + vol);
    //CandlestickLogger.info("Typeof(vol)" + typeof(vol));
    //CandlestickLogger.info("Typeof(this.vol)" + typeof(this.vol));
    //CandlestickLogger.info("Proportion: " + prop);
    assert(prop > 0 && prop <= 1.0);
    this.weightedAvg = this.weightedAvg*(1-prop) + price*prop;
    //CandlestickLogger.info("weighted avg " + this.weighted_avg);
    this.vol += vol;
    this.tradeCount += 1;
  };

  this.setInteresting = function() {
    this.interesting = true;
  };

  this.isInteresting = function() {
    return (this.interesting === true);
  };

  this.print = function() {
    CandlestickLogger.info("CANDLE " + this.name);
    CandlestickLogger.info("Open: " + this.priceFormatter.format(this.open));
    CandlestickLogger.info("Close: " + this.priceFormatter.format(this.close));
    CandlestickLogger.info("WeightAvg: " + this.priceFormatter.format(this.weightedAvg));
    CandlestickLogger.info("Vol: " + this.vol);
    //CandlestickLogger.info("WeightAvgVol: " + this.getWeightedAvgVol());
  };

  this.stringify = function() {
    return JSON.stringify({
      open: this.open,
      close: this.close,
      high: this.high,
      low: this.low,
      vol: this.vol
    });
  };

  //CandlestickLogger.info("Finished new candlestick.");
}

module.exports = Candlestick;
