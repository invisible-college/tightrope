// Test an order, and trade
var assert = require('assert');
var Order = require('../order');
var Trade = require('../tradeObj');


var o1 = new Order("0.02855598", "0.00315596",
  "Tue Mar 22 2016 09:46:29 GMT-0700 (PDT)", 'sell');
o1.orderNumber = 1;
var o2 = new Order("0.02852505", "1.53558825",
  "Tue Mar 22 2016 09:46:29 GMT-0700 (PDT)", 'buy');
o2.orderNumber = 2;

assert(o1.isOpen());
assert(o2.isOpen());

var t1 = new Trade("0.02855598", "0.00032144", "Tue Mar 22 2016 09:46:29 GMT-0700 (PDT)", "5483294", 'buy', "0.00000917");
var t2 = new Trade("0.02855598", "0.00283452", "Tue Mar 22 2016 09:46:29 GMT-0700 (PDT)", "5483295", 'buy', "0.00008094");

var t3 = new Trade("0.02852505", "0.02134369", "Tue Mar 22 2016 09:46:30 GMT-0700 (PDT)", "5483296", 'sell', "0.00060882");
var t4 = new Trade("0.02852505", "0.0200238", "Tue Mar 22 2016 09:46:31 GMT-0700 (PDT)", "5483297", 'sell', "0.00057117");
var t5 = new Trade("0.02852505", "1.49422076", "Tue Mar 22 2016 09:46:32 GMT-0700 (PDT)", "5483298", 'sell');

o1.addTrade(t1);
assert(o1.isOpen());
o1.addTrade(t2);
assert(o1.isClosed());

o2.addTrade(t3);
assert(o2.isOpen());
o2.addTrade(t4);
assert(o2.isOpen());
o2.addTrade(t5);
assert(o2.isClosed());
