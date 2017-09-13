// Test script to buy stupid cheap ETH
// This will almost never happen, just to test API key + secret

var Poloniex = require('./lib/poloniex')
const configJson = require('config.json')
config = configJson('./creds-traderbot2.json')

// Create a new instance, with optional API key and secret
poloniex = new Poloniex( config['apiKey'],
        config['secret'],
        true
        )

// * IMPORTANT *
// The line below is temporary, to avoid API server certficiate failure `Error: CERT_UNTRUSTED`
// This is presumably a temporary issue and has been reported to Poloniex.
// Do not include the line below once the issue is resolved.
Poloniex.STRICT_SSL = false;

/*
// Public call
poloniex.getTicker(function(err, data){
    if (err){
        console.log('ERROR', err);
        return;
    }

    console.log(data);
});
*/ 
function Order(price, amount) {
    this.price = price;
    this.amount = amount;

    this.print = () => {
        console.log(this.amount + " @ " + this.price);
    };

    return this;
}

var sellBook = [];
var buyBook = [];
/*
poloniex.getOrderBook("BTC", "ETH", 50, function(err, data) {
    if (err) {
        console.err('ERROR', err);
        return;
    }

    sells = data['asks'];
    console.log("Sell Book");
    for (var i = 0; i < sells.length; i++) {
        var newOrder = new Order(sells[i][0], sells[i][1]);
        newOrder.print();
        sellBook.push(newOrder);
    }

    buys = data['bids'];
    console.log("Buy Book");
    for (var i = 0; i < buys.length; i++) {
        var newOrder = new Order(buys[i][0], buys[i][1]);
        newOrder.print();
        buyBook.push(newOrder);
    }

});
*/

// Private call - requires API key and secret
/*
poloniex.sell('ETH', 'ETC', 100, 1, function(err, data){
    if (err){
        console.log('ERROR', err);
        return;
    }
    console.log("Bought 1 at 0.01");
    console.log(data);
});
*/
poloniex.myCompleteBalances(function(err, data) {
    if (err) { console.err(err) }
    console.log(data['ETC']['available'])
})
