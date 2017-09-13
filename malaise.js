// This is a Director that accepts new candlesticks
// and has a strategy of only paying attention to
// large spreads.
// The transition between up and down spreads triggers
// buys and sells.

SPREAD_THRESHOLD = 0.00004 // 0.04 bits
// threshold to signal an immediate shift
VOLUME_THRESHOLD = 100 // per candlestick period

var Malaise = function(spreadThreshold, volumeThreshold) {
  this.spreadThreshold = spreadThreshold || SPREAD_THRESHOLD;
  this.volumeThreshold = volumeThreshold || VOLUME_THRESHOLD;
  this.direction = "waking"; // just waking up
  // this can be "rising", "falling"

  // This pattern is the Default Callback Pattern
  // confidence - a number from 1 to 5
  //   1: weak confidence, you may lose money
  //   5: strong confidence, big price movement, you'll kick yourself later for not going big
  var defaultCallback = function(confidence) {
    console.log("Malaise DEFAULT with confidence: " + confidence);
  };

  this.buyCallback = defaultCallback;
  this.sellCallback = defaultCallback;

  this.onBuy = function(callback) {
    this.buyCallback = callback;
  };

  this.onSell = function(callback) {
    this.sellCallback = callback;
  };

  var confidence = 1;

  this.newCandlestick = (candlestick) => {

    // Check the riffraff at the door.
    if (candlestick.getAbsSpread() < this.spreadThreshold || candlestick.vol < this.volumeThreshold || !candlestick.isInteresting()) {
      return;
    }

    spread = candlestick.getSpread();
    console.log("MALAISE " + this.direction + " with confidence " + confidence);
    // Now that that's out of the way, only big players are left.
    if (this.direction === "falling") {
      if (spread > 0) {
        this.buyCallback(confidence);
        confidence = 1;
        this.direction = "rising";
      } else {
        // With each successive fall, we build confidence
        // that we will buy at the end of it.
        confidence += 1;
      }
    } else if (this.direction === "rising") {
      if (spread < 0) {
        this.sellCallback(confidence);
        confidence = 1;
        this.direction = "falling";
      } else {
        // With each successive rise, we build confidence
        // that we will sell at the end of it
        confidence += 1;
      }
    } else {
      // We just woke up
      if (spread > 0) {
        this.buyCallback(1);
        this.direction = "rising";
      } else {
        this.sellCallback(1);
        this.direction = "falling";
      }
    }
  };

};

module.exports = Malaise;
