// This is one of three values, and keeps track of
// the last k directions of candlesticks
// It is a state machine for buys and sells.

VOLUME_THRESHOLD = 1; // 100 ETH of volume in one minute
SPREAD_THRESHOLD = 0.00004 // threshold to signal an immediate shift

var Direction = (k, stateMachine, volumeThreshold) => {
  this.k = k;
  this.previous = [];
  this.direction = "steady";
  this.volumeThreshold = volumeThreshold || VOLUME_THRESHOLD;

  if (!stateMachine) {
    throw new Error("No state machine given to direction.");
  }
  this.stateMachine = stateMachine;

  this.newCandlestick = (candlestick) => {

    // Make sure this candlestick is weighty enough to merit
    if (candlestick.vol <= VOLUME_THRESHOLD) {
      return;
    }

    // If we are full, discard old candlesticks
    if (this.previous.length >= this.k) {
      this.previous.splice(0, 1);
    }
    this.previous.push(candlestick.isGreen() ? "up" : "down");
    console.log(JSON.stringify(this.previous));

    console.log("Spread " + candlestick.getAbsSpread());

    if (candlestick.getAbsSpread() > SPREAD_THRESHOLD) {
      // we suspend the normal rules for a really large spread
      console.log("LARGE SPREAD " + candlestick.getAbsSpread());
      this.direction = candlestick.isGreen() ? "up" : "down";
    } else {
      var up = true;
      var down = true;
      for (var i = 0; i < this.k; i++) {
        if (i >= this.previous.length) {
          // if we have fewer than k previous candlesticks,
          // we are steady / indeterminate
          up = false;
          down = false;
          break;
        }
        if (this.previous[i] === "down") {
          up = false;
        } else if (this.previous[i] === "up") {
          down = false;
        }
      }
      // If all the previous k periods are up, we are up
      // otherwise if all are down, we are down
      // otherwise we are steady (a mix of both)
      if (up) {
        this.direction = "up";
      } else if (down) {
        this.direction = "down";
      } else {
        this.direction = "steady";
      }
    }
    stateMachine.updateDirection(this);
  };

  this.isUp = () => {
    return (this.direction === "up");
  };

  this.isDown = () => {
    return (this.direction === "down");
  };

  this.isSteady = () => {
    return (this.direction === "steady");
  };

  return this;
};

module.exports = Direction;
