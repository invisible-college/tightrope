// Poloniex supports prices and amounts to the eighth decimal place
DECIMAL_PLACES = 8;

NOTHING_THRESHOLD = Math.pow(10, -9);
// Poloniex doesn't keep track of things beyond the 8th decimal place


module.exports = {
    priceToKey: function(price) {
      return parseInt(price * Math.pow(10, DECIMAL_PLACES));
    },
    keyToPrice: function(key) {
      return (key / Math.pow(10, DECIMAL_PLACES)).toFixed(DECIMAL_PLACES);
    },
    approxEquals: function(val1, val2, tolerance) {
      return (Math.abs(val1 - val2) < (tolerance || NOTHING_THRESHOLD));
    },
    POLONIEX_TOLERANCE: Math.pow(10, -8),
    NOTHING_THRESHOLD: NOTHING_THRESHOLD
};
