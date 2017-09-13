var assert = require('assert');
var Util = require('./util');

module.exports = {
  assertEquals: (actual, expected) => {
    if (actual !== expected) {
      console.error("Expected " + expected + " but was " + actual);
      assert(false);
    }
  },

  assertApprox: (actual, expected, tolerance) => {
    if (!Util.approxEquals(actual, expected, tolerance)) {
      console.error("Expected " + expected + " but was " + actual);
      assert(false);
    }
  },

  isNothing: (value) => {
    return Math.abs(value) < NOTHING_THRESHOLD;
  },

};
