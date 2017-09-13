// A formatter for pretty-printing price.
// All prices from Poloniex are large integers of the smallest denomination
// (satoshis, wei, etc.)
// We multiply it up to a number that's easy to deal with.
PriceFormatter = function(currency, multiplierPlaces, decimalPlaces) {

  this.currency = currency || "bits"; // we default to bits (0.001 BTC)
  this.decimalPlaces = decimalPlaces || 3;
  multiplierPlaces = multiplierPlaces + this.decimalPlaces || 3 + this.decimalPlaces;
  this.multiplier = Math.pow(10, multiplierPlaces); // default to bits + 3 decimal places
  this.divider = Math.pow(10, this.decimalPlaces);
  TOTAL_DECIMAL_PLACES = 8; // Poloniex keeps track of 8th decimal place

  //console.log("Price formatter");
  //console.log("currency= " + this.currency);
  //console.log("multiplier: " + this.multiplier);
  //console.log("divider: " + this.divider);

  this.format = function(price) {
    return (Math.round(price * this.multiplier) / this.divider).toFixed(this.decimalPlaces) + " " + this.currency;
  };

  this.round = function(price) {
    return price.toFixed(TOTAL_DECIMAL_PLACES);
  };

  return this;

};

module.exports = PriceFormatter;
