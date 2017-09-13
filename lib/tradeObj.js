var Test = require('./test');
var Util = require('./util');
var assert = require('assert');

// A Trade object, representing a buy or sell at a certain amount at a
// certain price, on a certain exchange
// We assume everything is a string, which allows us to uniformly handle
// trades created programmatically by our client / trader, and those read
// back from a logfile or returned by Poloniex.
// total is optional, and if it exists, we use it as a checksum
// for price and amount

function Trade(priceString, amountString, dateString, tradeId, type, total) {
    //assert(priceString && amountString && dateString && tradeId && type);
    this.price = parseFloat(priceString);
    this.amount = parseFloat(amountString);
    this.date = new Date(dateString);
    this.total = this.price * this.amount;
    // We keep tradeId as a string, unless we have a good reason to numerize it
    // aka listing trades in sorted order some time
    this.tradeId = tradeId;

    assert(type === 'buy' || type === 'sell');
    this.type = type;

    if (total) {
        Test.assertApprox(parseFloat(total), this.total, Util.POLONIEX_TOLERANCE);
    }

    this.toString = () => {
      return this.tradeId + " " + this.type + " " + this.amount + " @ " +
        this.price + " on " + this.date;
    };

    this.print = () => {
        console.log(this.toString());
    };

    return this;
}

module.exports = Trade;
