// This is a Director that accepts new candlesticks
// and has a strategy of rebalancing between the two pairs
// with a fixed percentage.

// Rebalance at this interval of number of candlesticks 
REBALANCE_FREQUENCY = 150;

var Rebalance = function() {
  var inBalance = 50.0;
  var outBalance = 50.0;

  var phase = 0;

  this.newCandlestick = (candlestick) => {
    var price = candlestick.getWeightedAvg();
    console.log("Phase " + phase);
    console.log("Price " + price);
    console.log("In Value " + inBalance * price);
    console.log("Out Value " + outBalance);
    console.log("Total Value " + (inBalance*price + outBalance));
    phase += 1;
    if (phase < REBALANCE_FREQUENCY) {
        return;
    }

    phase = 0;
    var diff = (inBalance*price) - outBalance;
    var half = diff / 2.0;
    var inAmt = half / price;
    if (diff > 0) {
        // We have too much IN, sell half the difference to get it OUT
        inBalance -= inAmt;
        outBalance += half;
        console.log("Sold inAmt " + inAmt);
    } else {
        // We have too much OUT, buy half the difference to get it IN
        inBalance -= inAmt;
        outBalance += half;
        console.log("Bought inAmt " + inAmt);
    }
  };

};

module.exports = Rebalance;
