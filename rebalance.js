// This is a Director that accepts new candlesticks
// and has a strategy of rebalancing between the two pairs
// with a fixed percentage.

// Rebalance at this interval of number of candlesticks 

var Rebalance = function(frequency_minutes, _inBalance, _outBalance) {

  this.inBalance = _inBalance
  this.outBalance = _outBalance
  this.total = 0
  this.originalTotal = 0
  this.originalPrice = 0
  this.originalInBalance = _inBalance

  var defaultCallback = function(amount) {
    console.log("Rebalance DEFAULT buy/sell amt : " + amount);
  };

  this.buyCallback = defaultCallback;
  this.sellCallback = defaultCallback;

  this.onBuy = function(callback) {
    this.buyCallback = callback;
  };

  this.onSell = function(callback) {
    this.sellCallback = callback;
  };

  var phase = 0;

  this.setOutBalance = function(newOutBalance) {
    console.log("Setting outBalance: " + newOutBalance);
    this.outBalance = newOutBalance
  }

  this.setInBalance = function(newInBalance) {
    console.log("Setting inBalance: " + newInBalance);
    this.inBalance = newInBalance
  }

  this.newCandlestick = (candlestick) => {
    var price = candlestick.getWeightedAvg();
    console.log("Phase " + phase);
    console.log("Price " + price);
    console.log("In Value " + this.inBalance * price);
    console.log("Out Value " + this.outBalance);
    this.total = (this.inBalance*price) + this.outBalance;
    
    if (this.originalTotal == 0) { this.originalTotal = this.total; }
    if (this.originalPrice == 0) { this.originalPrice = price; }

    console.log("Total Value " + this.total);
    console.log("Rebalance Profit " + (this.total - this.originalTotal));
    console.log("Holding Profit " + (this.originalInBalance*(price - this.originalPrice)));
    if (phase % frequency_minutes != 0) {
        phase += 1;
        return;
    }

    phase += 1;
    var diff = (this.inBalance*price) - this.outBalance;
    var half = diff / 2.0;
    var inAmt = half / price;
    if (diff > 0) {
        // We have too much IN, sell half the difference to get it OUT
        this.sellCallback(price, inAmt)
        this.inBalance -= inAmt;
        this.outBalance += half;
        console.log("Sold inAmt " + inAmt);
    } else {
        // We have too much OUT, buy half the difference to get it IN
        this.buyCallback(price, inAmt)
        this.inBalance -= inAmt;
        this.outBalance += half;
        console.log("Bought inAmt " + inAmt);
    }
  };

};

module.exports = Rebalance;
