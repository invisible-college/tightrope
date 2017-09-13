// An event manager can accept subscriptions to the three
// types of push events from the Poloniex API and
// either a connection or a file source (for simulation)
// How do we want to switch between the two? A command-line
// argument.
//
// orderEvent (a new trade)
// modifyUpdate (a new order)
// remove (remove an existing order from the books)

// Crib most of this from parseTradeHistory and meanbot2.js
// since we want to eventually test our meanbot strategy on offline
// history

var EventManager = function(args) {
  var fileName = args.filename;
  var connection = args.connection;

  // We have default callback handlers so that our client
  // knows what to create
  var newTradeCallback = function(newTrade) {
    console.log("DEFAULT newTrade");
    newTrade.print();
  };

  var orderBookModifyCallback = function(data) {
    console.log("DEFAULT orderBookModify");
    console.log(data);
  };

  var orderBookRemoveCallback = function(data) {
    console.log("DEFAULT orderBookRemove");
    console.log(data);
  };

  assert((fileName && !connection) || (!fileName && connection));

  var start = function() {
    if (filename) {
      fs.readFile(filename, function(err, data) {
        if (err) {
          console.error(err);
          return;
        }
        //console.log(data.toString());
        var lines = data.toString().split('\n');
        for (var i in lines) {
          if (lines[i].indexOf("New Trade") !== -1) {
            var tokens = lines[i].split(" ");
            var dateString = listJoin(tokens, 14, 20);
            var type = tokens[3];
            //console.log("Type: " + type);
            var volume = parseFloat(tokens[5]);
            var price = parseFloat(tokens[7]);
            //console.log("Volume: " + volume);
            //console.log("Price: " + price);
            //console.log(dateString);
            var date = new Date(dateString);
            //console.log("Date: " + date);
            var order = Order(tokens[7], tokens[5], dateString, tokens[3]);
            //order.print();
            candleManager.orderHandler(order);
          }
        }
      });
    }
  }

  }


  var onNewTrade(onTradeCallback) {
    this.onTradeCallback = onTradeCallback;
  };

  var

};

module.exports = EventManager;
