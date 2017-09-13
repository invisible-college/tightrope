// An order manager takes buy/sell orders from a client / trader
// and also polls Poloniex to get the current open orders.
// [This is a hack, because we can't subscribe to order closing events.]
// It associates order numbers and trade IDs when they close
// and also allows the client / trader to register callbacks
// when an order closes, or after a timeout (needing to be cancelled).

// An OrderManager is associated with a given market (currency pair).
// OrderManager's also convert buy/sell discrete data (price, amount)
// and package it into an Order object, including an orderNumber,
// and passes it back to the client/trader, and will not mutate it.
// This is the chief data structure used to communicate.

// It doesn't know anything about the current prices or the order book.
// For that, the client/trader has to interact with OrderBook separately.

// OrderManagers also let you create contingent bets,
// to only place one order (like a sell) contingent on another bet
// completing. This lets you place multiple "parallel" bets with the
// same funds without locking them up.

const Order = require('./order')
const Trade = require('./tradeObj')
const Top = require('./top')
const Util = require('./util')

const Logger = require('./logger')
const OrderManagerLogger = new Logger('OrderManager', ['info'])

var OrderManager = function(args) {
  var currencyOut = args.currencyOut;
  var currencyIn = args.currencyIn;
  var poloniex = args.poloniex;
  var minDist = args.minDist;

  // Top of Orders, sorted by date created (this may change later to
  // datetime modified, for moved orders)

  // Buy orders are a max-top because we want to set a maximum bid price key limit
  this.buyOrders = new Top('max', minDist);

  // Sell orders are a min-bottom because we want to set a minimum ask price key limit
  this.sellOrders = new Top('min', minDist);

  var addTradesToOrder = (newOrder, trades) => {
    var total = 0;
    for (var i in trades) {
      var newTrade = new Trade(trades[i].price, trades[i].amount,
        trades[i].date, trades[i].tradeID, type);
      newOrder.addTrade(newTrade);
    }
  };

  var placeOrderHelper = (price, amount, timeout, callback, poloniexFunc, type) => {

    // Set the creation date as now.
    var now = new Date();
    var newOrder = new Order(price, amount, now, type);

    // Schedule the timeout function in the future, and pass in this order
    // so our client / trader can take appropriate action.
    if (callback) {
      OrderManagerLogger.info("Setting timeout callback for " + newOrder.toString());
      var timeoutId = setTimeout(callback, timeout*1000, newOrder);
      newOrder.timeoutId = timeoutId;
    }

    // Example data returned to callback
    // {"orderNumber":31226040,
    //  "resultingTrades":[{"amount":"338.8732","date":"2014-10-18 23:03:21",
    //                      "rate":"0.00000173","total":"0.00058625",
    //                      "tradeID":"16164","type":"buy"}]}
    poloniexFunc(currencyOut, currencyIn, price, amount,
      function(err, data) {
        OrderManagerLogger.info("Placing order " + JSON.stringify(data), 'placeOrderHelper');
        if (err) {
          console.error(err);
          // TODO handle contingency for not enough currencyIn
          return;
        }
        newOrder.orderNumber = data['orderNumber'];
        addTradesToOrder(newOrder, data['resultingTrades']);
      });

    //this.orders.add({key: now.getTime(), value: newOrder});
    return newOrder;
  };

  // Place a buy order
  // price - float, currencyOut price of currencyIn units,
  //                representing maximum we are willing to pay
  // amount - float, number of units of currencyIn to buy
  // ttl - integer, number of seconds to leave this order open
  // closeFunc - callback function when this order closes
  //   function(order, tradeList)
  // timeoutFunc - callback function when this order times out
  //   function(order)
  // Returns Order containing the given orderNumber
  this.buy = function(price, amount, timeout, callback) {
    var priceKey = Util.priceToKey(price);
    var buyPriceKey = this.buyOrders.search();
    if (!buyPriceKey) {
      OrderManagerLogger.info("First buy at " + price);
      buyPriceKey = priceKey;
    }

    var buyPrice = Util.keyToPrice(buyPriceKey);

    if (buyPriceKey > priceKey) {
      OrderManager.logger.info("The only available buy is at " + buyPrice + " , too expensive, bailing.");
      return;
    }
    var newOrder = placeOrderHelper(buyPrice, amount, timeout, callback, poloniex.buy.bind(poloniex), 'buy');
    this.buyOrders.add({key: buyPriceKey, value: newOrder});
    return newOrder;
  };

  // Place a sell order, same as buy function
  // but now price is the minimum we are willing to sell for
  this.sell = function(price, amount, timeout, callback) {
    var priceKey = Util.priceToKey(price);
    var sellPriceKey = this.sellOrders.search();
    if (!sellPriceKey) {
      OrderManagerLogger.info("Could not place sell order at or above " + price);
      sellPriceKey = priceKey;
    }

    var sellPrice = Util.keyToPrice(sellPriceKey);

    if (sellPriceKey < priceKey) {
      OrderManagerLogger.info("The only available sell is at " + sellPrice + " , too cheap, bailing.");
      return;
    }

    var newOrder = placeOrderHelper(sellPrice, amount, timeout, callback, poloniex.sell.bind(poloniex), 'sell');
    this.sellOrders.add({key: sellPriceKey, value: newOrder});
    return newOrder;
  };

  // Changes the price of the current order, but keeps its amount the
  // same. If the order already has some trades (it is partially fulfilled),
  // then these orders at the old price will remain in this order,
  // and can count towards closing it.
  // Returns true if order
  this.move = function(order, newPrice) {
    if (order.type === 'buy') {
      this.buyOrders.remove(order.key);
      order.setPrice(newPrice);
      this.buyOrders.add({key: order.key, value: order});
    } else if (order.type === 'sell') {
      this.sellOrders.remove(order.key);
      order.setPrice(newPrice);
      this.sellOrders.add({key: order.key, value: order});
    }

    poloniex.moveOrder(order.orderNumber, newPrice,
      function(err, data) {
        if (err) {
          console.error(err);
          return;
        }
        success = data['success'];
        newOrderNumber = data['orderNumber'];
        trades = data['resultingTrades'];
        addTradesToOrder(order, trades);
        OrderManagerLogger.info(data);
        if (success === 1) {
          order.orderNumber = newOrderNumber;
          OrderManagerLogger.info("Successfully moved to order " + order.orderNumber);
        } else {
          OrderManagerLogger.info("Failed to move order " + order.orderNumber);
        }
      }
    );

  };

  // Cancel the given order, which must have an orderNumber.
  this.cancel = function(order) {
    if (order.type === 'buy') {
      this.buyOrders.remove(order.key);
    } else if (order.type === 'sell') {
      this.sellOrders.remove(order.key);
    }
    poloniex.cancelOrder(order.orderNumber, function(err, data) {
      if (err) {
        OrderManagerLogger.error(err);
        return;
      }
      OrderManagerLogger.info(data);
    });
  };

  // Now we set our own repeating function to poll Poloniex for open orders
  setInterval(function() {
    poloniex.myOpenOrders(currencyOut, currencyIn, function(err, body) {
      if (err) {
        //OrderManager.logger.error(err);
        return;
      }
      //OrderManager.logger.info(body);
    });
  }, 1000);

};

module.exports = OrderManager;
