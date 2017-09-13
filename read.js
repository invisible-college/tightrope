var autobahn = require('autobahn');
var wsuri = "wss://api.poloniex.com";
var fs = require('fs');
var file = "eth_btc.db"
var exists = fs.existsSync(file)
var sqlite3 = require("sqlite3").verbose()
var db = new sqlite3.Database(file)

db.serialize(function() {
    if (!exists) {
        console.log("We don't have ETH_BTC table. Run test.js first.")
    }
});


db.each("SELECT rowid AS id, last FROM ETH_BTC", function(err, row) {
    console.log(row.id + " " + row.last);
})

db.close()
