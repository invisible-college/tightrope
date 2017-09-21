var PriceFormatter = require('../priceFormatter');
var test = require('../lib/test');

var pf = new PriceFormatter();

var formattedPrice = pf.format(0.02456666666);

test.assertEquals(formattedPrice, "24.567");

var pf2 = new PriceFormatter("ETH", 2, 2);

var formattedPrice2 = pf2.format(0.02456666666);

test.assertEquals(formattedPrice2, "2.46");
