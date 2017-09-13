// An OrderSync is a class which polls Poloniex regularly to
// get the list of open orders, and to trigger callbacks
// when a given order closes (to set contingent bets, e.g.)
//

OrderSync = function(args) {
    this.poloniex = args.poloniex

    setInterval(function() {
        poloniex.myOpenOrders(
