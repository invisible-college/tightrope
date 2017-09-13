// Place the following orders until we complete.

// Buy or sell order
// Amount to sell or buy
// Variance in BTC (we will randomly choose from the normal distribution centered on the current price)
// limit (max price to bid if we are buying, min price to ask if we are selling)

// Amount to one up (or one down) the current best offer
ONE_UP = 0.0000001;

var PositionChange = function(poloniex, orderBook, type, amount,
  variance, limit) {
  this.type = type;
  this.status = "inProgress"; // can also be failed, completed, cancelled
  this.poloniex = poloniex;
  this.orderBook = orderBook;
  this.amount = amount;
  this.limit = limit; // the minimum amount to ask or maximum amount to bid
  this.currentPrice;
  this.orderNumber;

  this.cancelOrder = function() {
    poloniex.cancelOrder(this.orderNumber, function(err, data) {
      if (err) {
        console.error(err);
        return;
      }
      console.log(data);
    });
  };

  this.moveOrder = function() {
    poloniex.moveOrder(this.orderNumber, this.currentPrice,
      function(err, data) {
        if (err) {
          console.error(err);
          return;
        }
        success = data['success'];
        newOrderNumber = data['orderNumber'];
        resultingTrades = data['resultingTrades'];
        console.log(data);
        if (success === 1) {
          this.orderNumber = newOrderNumber;
          console.log("Successfully moved to order " + this.orderNumber);
        } else {
          console.log("Failed to move order " + this.orderNumber);
        }
      }
    );
  };

  // Data of the form
  // {"success":1,"orderNumber":"239574176","resultingTrades":{"BTC_BTS":[]}}
  this.newHighestBid = function(highestBid) {
    // Disable smart bidding behavior for now, because it's hard :|
    /*
    console.log(highestBid);
    this.currentPrice += ONE_UP;
    if (this.currentPrice > this.currentPrice * this.limit) {
      this.cancelOrder();
    } else {
      this.moveOrder();
    }
    */
  };

  this.newLowestAsk = function(lowestAsk) {
    // Disable smart bidding behavior for now, because it's hard :|
    /*
    console.log(lowestAsk);
    this.currentPrice -= ONE_UP;
    if (this.currentPrice < this.currentPrice * this.limit) {
      this.cancelOrder();
    } else {
      this.moveOrder();
    }
    */
  };

  this.print = function() {
    console.log("Position Change ");
    console.log("Amount " + this.amount);
    console.log("Price " + this.price);
  };

  this.completed = function(data) {
    console.log(this.type + " order completed with data " + data);
  };

  var placeOrderCallback = function(err, data) {
    console.log("Placing order " + JSON.stringify(data));
    if (err) {
      console.error(err);
      return;
    }
    console.log(data);
    this.orderNumber = data['orderNumber'];
    var resultingTrades = data['resultingTrades'];
    var total = 0;
    for (var i in resultingTrades) {
      total += resultingTrades[i].amount;
    }
    if (total >= this.amount) {
      console.log("Order completed");
    }
  };

  this.doTheThing = function() {
    console.log("Doing the thing");
    this.orderBook.execute(function() {

      if (type === "buy") {
        this.currentPrice = orderBook.getHighestBid() + ONE_UP;
        this.print();

        // {"orderNumber":31226040,"resultingTrades":[{"amount":"338.8732","date":"2014-10-18 23:03:21","rate":"0.00000173","total":"0.00058625","tradeID":"16164","type":"buy"}]}
        poloniex.buy(orderBook.currencyOut, orderBook.currencyIn,
          this.currentPrice, this.amount, placeOrderCallback);
      } else if (type === "sell") {
        this.currentPrice = orderBook.getLowestAsk() - ONE_UP;
        this.print();
        // {"orderNumber":31226040,"resultingTrades":[{"amount":"338.8732","date":"2014-10-18 23:03:21","rate":"0.00000173","total":"0.00058625","tradeID":"16164","type":"buy"}]}
        poloniex.sell(orderBook.currencyOut, orderBook.currencyIn,
          this.currentPrice, this.amount, placeOrderCallback);
      }
    }.bind(this));
  };

  return this;
};

module.exports = PositionChange;
