// This state machine classifies any market state into
// neutral - in which case, do nothing
// bottomOut - we've finished falling, started rising, buy
// topOut - we've finished rising, started falling, sell
// rising - we've started from neutral or bottomOut, going up
// falling - we've started from neutral or topOut, going down

// A typical sequence is neutral -> rising -> topOut ->
// falling -> bottomOut -> , and so forth.
// After a long enough period of steady, we reset to neural.
// The neutral period could last arbitrarily long
// The topOut/falling, bottomOut/rising could be arbitrarily short

// If we experience 10 steady periods, go to neutral
NEUTRAL_THRESHOLD = 10;

var StateMachine = function() {

    this.state = "neutral";

    var defaultCallback = function() {
      console.log("STATE MACHINE: Default callback");
      console.log("newState  " + this.state);
    };

    this.risingCallback = defaultCallback;
    this.fallingCallback = defaultCallback;
    this.bottomOutCallback = defaultCallback;
    this.topOutCallBack = defaultCallback;
    this.neutralCallback = defaultCallback;

    this.onRising = function(callback) {
      this.risingCallback = callback;
    };

    this.onFalling = function(callback) {
      this.fallingCallback = callback;
    };

    this.onBottomOut = function(callback) {
      this.bottomOutCallback = callback;
    };

    this.onTopOut = function(callback) {
      this.topOutCallback = callback;
    };

    this.onNeutral = function(callback) {
      this.neutralCallback = callback;
    };

    var steadyCount = 0;

    this.updateDirection = function(newDirection) {
      if (newDirection.isSteady()) {
        steadyCount += 1;
      } else {
        steadyCount = 0;
      }
      if (steadyCount > NEUTRAL_THRESHOLD) {
        this.neutralCallback();
        this.state = "neutral";
        steadyCount = 0;
      } else if (this.state === "neutral") {
          if (newDirection.isUp()) {
            this.state = "bottomOut";
            this.bottomOutCallback();
          } else if (newDirection.isDown()) {
            this.state = "topOut";
            this.topOutCallback();
          }
      } else if (this.state === "bottomOut") {
        if (newDirection.isUp()) {
          this.state = "rising";
          this.risingCallback();
        } else if (newDirection.isDown()) {
          this.state = "falling";
          this.fallingCallback();
        }
      } else if (this.state === "topOut") {
        if (newDirection.isUp()) {
          this.state = "rising";
          this.risingCallback();
        } else if (newDirection.isDown()) {
          this.state = "falling";
          this.fallingCallback();
        }
      } else if (this.state === "rising") {
        if (newDirection.isDown()) {
          this.state = "topOut";
          this.topOutCallback();
        }
      } else if (this.state === "falling") {
        if (newDirection.isUp()) {
          this.state = "bottomOut";
          this.bottomOutCallback();
        }
      }
    };

    return this;

};

module.exports = StateMachine;
