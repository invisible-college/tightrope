module.exports = {
  loadPastHistory: function(num_hours, poloniex, candleManager, currencyOut, currencyIn) {
    return new Promise(function(resolve, reject) {
      // Begin the trade history call
      var now = new Date();
      var end = now.getTime();
      var start = end - (1000*3600*num_hours);
      var then = new Date(start);
      start = parseInt(start/1000); // these are in milliseconds, we want seconds
      console.log("Starting at " + then + " " + start);
      //assert(then.getHours() == now.getHours() - NUM_HOURS);

      poloniex.getTradeHistory(currencyOut, currencyIn, function(err, data) {
        if (err) {
          console.error(err);
          reject(Error(err));
          return;
        }

        /*
        Data of the form:
        [{"date":"2014-02-19 03:44:59","rate":"0.0011",
          "amount":"99.9070909","total":"0.10989779",
          "orderNumber":"3048809","type":"sell"},
         {"date":"2014-02-19 04:55:44","rate":"0.0015",
          "amount":"100","total":"0.15",
          "orderNumber":"3048903","type":"sell"},
          ...
        ]
        */
        //console.log(data);
        console.log("Getting " + data.length + " events.");
        for (var i = data.length-1; i >= 0; i--) {
          trade = data[i];
          type = trade['type'];
          tradeID = trade['tradeID']; // this stays a string
          globalTradeID = trade['globalTradeID']; // this stays a string
          price = parseFloat(trade['rate']);
          amount = parseFloat(trade['amount']);
          date = new Date(trade['date']); // as a human-readable string
          total = parseFloat(trade['total']);
          console.log("New Trade: " + tradeID + " " + type + " of " + amount + " @ " + price + " for a total of " + total + " on " + date);
          candleManager.minuteHandler(price, amount, date);
        }

        console.log("LINE OF HISTORY: We are now in the present.");
        resolve();

      }, start);

    });

  }

};
