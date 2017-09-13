var Util = require('./util');
var Test = require('./test');
var assert = require('assert');

// A buy or sell order, placed by a trader or received from Poloniex
// Trades that fulfill this order can be added.
// When enough trades are added, it closes itself.
// It can also be cancelled.
// It optionally contains a timeoutId for a callback function that is
// scheduled in the future, if it should not complete in time.

function Order(priceString, amountString, dateString, type) {
  // orders on the order book will not have a date.
  //assert(priceString && amountString && type);
  this.price = parseFloat(priceString);
  this.amount = parseFloat(amountString);
  this.date = new Date(dateString);
  this.type = type;
  this.key = Util.priceToKey(this.price);
  this.orderNumber = undefined;
  this.tradeList = [];
  this.status = 'open';
  // this should have a more generic name, like toInteger
  // we keep remaining amount in integer units to prevent rounding errors
  this.remainingAmount = Util.priceToKey(this.amount);

  this.setPrice = (newPrice) => {
    this.price = parseFloat(newPrice);
    this.key = Util.priceToKey(this.price);
  };

  this.addTrade = (newTrade) => {
    this.tradeList.push(newTrade);
    this.remainingAmount -= Util.priceToKey(newTrade.amount);

    // Make sure the trade is for the same price as us
    Test.assertApprox(newTrade.price, this.price, Util.POLONIEX_TOLERANCE);
    assert(this.remainingAmount >= 0);
    if (this.remainingAmount === 0) {
        console.log("order " + this.orderNumber + " closed.");
        this.close();
    }
  };

  this.isOpen = () => {
    return this.status === 'open';
  };

  this.isClosed = () => {
    return this.status === 'closed';
  };

  this.close = () => {
    this.status = 'closed';
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  };

  this.cancel = () => {
    this.status = 'cancel';
    this.close();
  };

  this.toString = () => {
    return this.key + " " + this.type + " " + this.amount + " @ " +
      this.price + " on " + this.date;
  };

  this.print = () => {
    console.log(this.toString());
  };

  return this;
}

module.exports = Order;
