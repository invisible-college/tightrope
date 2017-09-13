var autobahn = require('autobahn');
var wsuri = "wss://api.poloniex.com";
var fs = require('fs');

var start = new Date();

function getTimeString(time) {
    return time.getYear()+"_"+time.getMonth()+"_"+time.getDay()+"_"+time.getHours()+"_"+time.getMinutes();
}

var timeString = getTimeString(start);
var filename = "eth_btc_"+timeString+".db"
var exists = fs.existsSync(filename)
var sqlite3 = require("sqlite3").verbose()
var db = new sqlite3.Database(filename)


db.serialize(function() {
    if (!exists) {
        db.run("CREATE TABLE ETH_BTC (last real)");
        console.log("Creating ETH_BTC table for " + timeString);
    }
});

var connection = new autobahn.Connection({
  url: wsuri,
  realm: "realm1"
});


connection.onopen = function (session) {
        function marketEvent (args,kwargs) {
            console.log(args);
        }
        function tickerEvent (args,kwargs) {
            /* Parsing args using data from https://poloniex.com/support/api/ */
            // Do we ever get more than one item?
            item = args
            pair = item[0]

            if (pair !== "BTC_ETH") {
                return;
            }

            /* Check the time to see if we need to start a new table.
             * Start a new table every minute.
             */
            var now = new Date();
            if (now.getMinutes() > start.getMinutes()) {
                console.log("New minute " + now.getMinutes());
                db.close();
                console.log("Closing db");

                // New start, do this before making a new filename
                start = now;

                var timeString = getTimeString(start);
                filename = "eth_btc_"+timeString+".db"


                var exists = fs.existsSync(filename)
                db = new sqlite3.Database(filename)

                // Just as a sanity check
                if (!exists) {
                    db.run("CREATE TABLE ETH_BTC (last real)");
                }

                console.log("Instantiating new db");

                console.log("Creating ETH_BTC table for " + timeString);

            }

            console.log(args);
            last = item[1]
            lowestAsk = item[2]
            highestBid = item[3]
            percentChange = item[4]
            baseVolume = item[5]
            quoteVolume = item[6]
            isFrozen = item[7]
            high24Hour = item[8]
            low24Hour = item[9]
            console.log("pair " + pair);
            console.log("last " + last);


            var statement = db.prepare("INSERT INTO ETH_BTC VALUES (?)");
            console.log("statement");
            statement.run("last #" + last);
            statement.finalize();
        }
        function trollboxEvent (args,kwargs) {
                console.log(args);
        }
        session.subscribe('market', marketEvent);
        session.subscribe('ticker', tickerEvent);
        session.subscribe('trollbox', trollboxEvent);
}

connection.onclose = function () {
  console.log("Websocket connection closed");
}

connection.open();
/*
db.each("SELECT rowid AS id, last FROM ETH_BTC", function(err, row) {
    console.log(row.id + " " + row.last);
})
*/
