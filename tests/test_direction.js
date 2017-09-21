var Direction = require("../direction");
var StateMachine = require("../stateMachine");
var Candlestick = require("../candlestick");

var assert = require('assert');

var m = StateMachine();
m.onRising(function() {
  console.log("Rising!");
});
m.onFalling(function() {
  console.log("Falling!");
});
m.onTopOut(function() {
  console.log("Top out!");
});
m.onBottomOut(function() {
  console.log("Bottom out!");
});

var d = Direction(3, m);

var c1 = new Candlestick(0.035, 100);
c1.update(0.034, 100);
var c2 = new Candlestick(0.034, 200, c1);
c2.update(0.033, 100);
var c3 = new Candlestick(0.033, 300, c2);
c3.update(0.032, 100);
var c4 = new Candlestick(0.034, 200, c3);
c4.update(0.035, 100);
c4.print();
var c5 = new Candlestick(0.035, 300, c4);
c5.update(0.036, 100);
var c6 = new Candlestick(0.033, 400, c5);
c6.update(0.034, 100);
var c7 = new Candlestick(0.034, 400, c6);
c7.update(0.033, 100);

assert(d.isSteady());
d.newCandlestick(c1);
assert(m.state === "neutral");
assert(d.isSteady());
d.newCandlestick(c2);
assert(m.state === "neutral");
assert(d.isSteady());
d.newCandlestick(c3);
assert(d.isDown());
assert(m.state === "topOut");
d.newCandlestick(c4);
assert(d.isSteady());
assert(m.state === "topOut");
d.newCandlestick(c5);
assert(d.isSteady());
assert(m.state === "topOut");
d.newCandlestick(c6);
assert(d.isUp());
assert(m.state === "rising");
d.newCandlestick(c7);
assert(d.isSteady());
assert(m.state === "rising");
