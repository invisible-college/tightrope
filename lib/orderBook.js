var Top = require('./top');
var assert = require('assert');
var Util = require('./util');

// When the order book reaches depth 100, reset
// Actually this could not be reliable, since we could easily
// have long-standing orders open for a long time.
RESET_THRESHOLD = 100;

// Set a timer interrupt every minute to increment the time
// in case no trade comes through.
INTERRUPT_SECONDS = 60;

var Order = require('./order');

const Logger = require('./logger')
const OrderBookLogger = new Logger('OrderBook', ['info', 'error'])

// An OrderBook manages a book of open buy orders (called bids) and
// sell orders (called asks) from the market, including but also
// separately the orders from this company, so we can know
// when an order has been filled or not.

// To do this, it needs to subscribe to orderBook events to extract
// offers, as well as tradeEvents to extract price.
var OrderBook = function(currencyOut, currencyIn, company, candleManager) {
  this.poloniex = company.poloniex;
  this.connection = company.connection;
  this.state = "empty";
  this.currencyOut = currencyOut;
  this.currencyIn = currencyIn;
  this.currencyPair =  currencyOut + "_" + currencyIn;
  // The orders on the exchange
  // create these here for events that arrive before resetBooks
  this.buyOrders = new Top();
  this.sellOrders = new Top();

  this.candleManager = candleManager;

  // Our position changes
  this.myBuyChanges = {};
  this.mySellChanges = {};

  this.queue = [];

  // Keep track of our highest bids and lowest asks
  this.highestBid = 0;
  this.lowestAsk = Infinity;

  this.addModifyBuy = function(node) {
    this.buyOrders.add(node);
  };

  this.addModifySell = function(node) {
    this.sellOrders.add(node);
  };

  this.removeBuy = function(price) {
    this.buyOrders.remove(Util.priceToKey(price));
  };

  this.removeSell = function(price) {
    this.sellOrders.remove(Util.priceToKey(price));
  };

  this.addBuyChange = function(buyChange) {
    if (!buyChange.key) {
      OrderBookLogger.error("This buy change needs a key.");
      return;
    }
    this.myBuyChanges[buyChange.key] = buyChange;
  };

  this.removeBuyChange = function(buyKey) {
    delete(this.myBuyChanges[buyKey]);
  };

  this.addSellChange = function(sellChange) {
    if (!sellChange.key) {
      OrderBookLogger.error("This sell change needs a key.");
      return;
    }
    this.mySellChanges[sellChange.key] = sellChange;
  };

  this.removeSellChange = function(sellKey) {
    delete(this.mySellChanges.remove(sellKey));
  };

  var that = this;

  this.resetBooks = function() {
    this.buyOrders = new Top();
    this.sellOrders = new Top();
    this.poloniex.getOrderBook(currencyOut, currencyIn, 50, function(err, data) {
        if (err) {
            OrderBookLogger.error('ERROR', err);
            //reject("getOrderBook failed");
        }
        OrderBookLogger.debug(JSON.stringify(data))
        sells = data['asks'];
        OrderBookLogger.info("Sell Book");
        for (var i = 0; i < sells.length; i++) {
            var newOrder = new Order(sells[i][0], sells[i][1], undefined, 'sell');
            // These orders will not have a date or an order number
            that.sellOrders.add(newOrder);
        }

        buys = data['bids'];
        OrderBookLogger.info("Buy Book");
        for (var i = 0; i < buys.length; i++) {
            var newOrder = new Order(buys[i][0], buys[i][1], undefined, 'buy');
            // These orders will not have a date or an order number
            that.buyOrders.add(newOrder);
        }
        that.state = "updating";
        OrderBookLogger.info("Resetting order book");
        OrderBookLogger.info("Highest Bid: " + that.getHighestBid());
        OrderBookLogger.info("Lowest  Ask: " + that.getLowestAsk());
        assert(that.queue);
        that.queue.forEach(function(item) {
          item();
        });
        that.queue = [];
        //resolve("getOrderBook succeeded.");
    });
  };

  this.print = function() {
    OrderBookLogger.info("Order Book for " + this.currencyPair);
    OrderBookLogger.info("==========================");
    asks = this.sellOrders.getSortedNodes();
    bids = this.buyOrders.getSortedNodes();
    var max = Math.max(asks.length, bids.length);
    for (var i=0; i < max; i++) {
      var string = "";
      if (i < asks.length) {
        string += asks[i].toString();
      } else {
        string += "                 ";
      }
      string += " | ";
      if (i < bids.length) {
        string += bids[i].toString();
      } else {
        string += "                 ";
      }
      OrderBookLogger.info(string);
    }
  };

  // We expose this method to the outside for testing
  this.orderEvent = function (args,kwargs) {
    /* Parsing args using data from https://poloniex.com/support/api/ */
    // Do we ever get more than one item?
    OrderBookLogger.debug("Received " + args.length + " events.");

    args.forEach(function(item) {
      data = item['data'];
      eventType = item['type'];

      // We assume all event types have a subtype in their data
      type = data['type'];

      //console.log(data);
      if (eventType === "orderBookModify") {
        amount = data['amount'];
        rate = data['rate'];
        key = Math.round(rate * DECIMAL_PLACES);
        OrderBookLogger.debug("Type: " + type);
        if (type === 'bid') {
          that.addModifyBuy(new Order(rate, amount));
          var newHighestBid = that.getHighestBid();
          if (that.highestBid !== newHighestBid) {
            for (var orderKey in that.myBuyChanges) {
              that.myBuyChanges.orderKey.newHighestBid(newHighestBid);
            }
            that.highestBid = newHighestBid;
            OrderBookLogger.debug("New highest bid " + newHighestBid);
          }
          OrderBookLogger.debug("Bid for " + amount + " @ " + rate);
        } else if (type === 'ask') {
          that.addModifySell(new Order(rate, amount));
          var newLowestAsk = that.getLowestAsk();
          if (that.lowestAsk !== newLowestAsk) {
            for (var orderKey in that.mySellChanges) {
              that.mySellChanges.orderKey.newLowestAsk(newLowestAsk);
            }
            that.lowestAsk = newLowestAsk;
            OrderBookLogger.debug("New lowest ask " + newLowestAsk);
          }
          OrderBookLogger.debug("Ask for " + amount + " @ " + rate);
        }
      } else if (eventType == "orderBookRemove") {
        var rate = data['rate'];
        if (type === "bid") {
          var oldSize = that.buyOrders.getSize();
          var returned = that.buyOrders.remove(rate);
          if (!returned) {
            OrderBookLogger.error("ERROR: " + rate + " was not removed.");
          }
        } else if (type === "ask") {
          var oldSize = that.sellOrders.getSize();
          var returned = that.sellOrders.remove(rate);
          if (!returned) {
            OrderBookLogger.error("ERROR: " + rate + " was not removed.");
          }
        }
        OrderBookLogger.debug("Remove " + type + " orders @ " + rate);
      } else if (eventType == "newTrade") {
        tradeID = data['tradeID'];
        price = parseFloat(data['rate']);
        amount = parseFloat(data['amount']);
        date = new Date(data['date']);
        total = data['total'];
        key = Util.priceToKey(price);
        /*
        if (key in this.myBuyChanges && this.myBuyChanges[key].amount === amount) {
          this.myBuyChanges[key].completed(data);
          delete(this.buyChanges[key]);
        } else if (key in this.mySellChanges && this.mySellChanges[key].amount === amount) {
          this.mySellChanges[key].completed(data);
          delete(this.mySellChanges[key]);
        }
        */
        OrderBookLogger.debug(`New Trade ID: ${tradeID} ${type} of ${amount} @ ${price} for a total of ${total} on ${date}`);
        that.candleManager.minuteHandler(price, amount, date);
      } else {
        OrderBookLogger.info("Unknown orderBook event type: " + eventType);
      }
      if (that.buyOrders.getSize() > RESET_THRESHOLD ||
          that.sellOrders.getSize() > RESET_THRESHOLD) {
        that.resetBooks();
      }

    });
    //console.log("Buy size " + this.buyOrders.getSize());
    //console.log("Sell size " + this.sellOrders.getSize());
  };

  this.getLowestAsk = () => {
    if (this.state === "empty") {
      return;
    } else {
      return this.sellOrders.nodes[0].price;
    }
  };

  this.getHighestBid = () => {
    if (this.state === "empty") {
      return;
    } else {
      return this.buyOrders.nodes[0].price;
    }
  };

  this.execute = function(callback) {
    if (this.state === "empty") {
      this.queueUp(callback);
    } else {
      callback();
    }
  };

  this.queueUp = function(callback) {
    this.queue.push(callback);
  };

  this.start = function() {
    this.resetBooks();

    if (!this.connection) {
      OrderBookLogger.info("DEMO ORDER BOOK.");
      return;
    }
    this.connection.onopen = function (session) {
      OrderBookLogger.info("Started up with " + that.currencyPair);
      session.subscribe(that.currencyPair, that.orderEvent.bind(that));
    };

    this.connection.onclose = function (reason, details) {
      OrderBookLogger.info("Closing connection and order book.");
      OrderBookLogger.info("Reason= " + reason);
      OrderBookLogger.info("Details= " + JSON.stringify(details));
    };

    this.connection.open();
  };

  return this;
};

module.exports = OrderBook;

