var CandleStick = require('../lib/candlestick');
var test = require('../lib/test');
var assertApprox = test.assertApprox;

var c1 = new CandleStick(0.02456, 100);
c1.update(0.02556, 200);

c1.print();

assertApprox(c1.getWeightedAvg(), 0.025226666);

c1.update(0.02356, 300);
assertApprox(c1.getAbsSpread(), 0.001);

c1.end();

assertApprox(c1.getSpread(), -0.001);

assertApprox(c1.getWeightedAvg(), 0.024393333);
