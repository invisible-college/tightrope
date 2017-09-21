var Top = require("../lib/top");
var assert = require('assert');
var Util = require('../lib/util');
var Test = require('../lib/test');

var t = new Top();

var n1 = {key: Util.priceToKey(0.03500000), amount: 1794.83796546};
var n2 = {key: Util.priceToKey(0.03190000), amount: 283.65931865};
var n3 = {key: Util.priceToKey(0.03240000), amount: 245.59991410};

// We add them in order greatest, least, middle,
// and expect to retrieve them in order: greatest, middle, least
t.add(n1);
t.add(n2);
t.add(n3);

var l1 = t.getSortedNodes();

assert(l1.length === 3);
assert(l1[0] === n1);
assert(l1[1] === n3);
assert(l1[2] === n2);

t.remove(n1.key);
var l2 = t.getSortedNodes();

assert(l2.length === 2);
assert(l2[0] === n3);
assert(l2[1] === n2);

// Now let's try a min-Top (technically, a Bottom)
// We expect the order to be the opposite
var b = new Top('min');

b.add(n1);
b.add(n2);
b.add(n3);

var l3 = b.getSortedNodes();

assert(l3.length === 3);
assert(l3[0] === n2);
assert(l3[1] === n3);
assert(l3[2] === n1);

// Test merge function

var t4 = new Top();
t4.add({key: 1, value: 'a'});
t4.add({key: 2, value: 'b'});
t4.add({key: 1, value: 'c'}, function(oldNode, newNode) {
  oldNode.value += newNode.value;
});

assert(t4.nodes[1].value === 'ac');

// Test merge function for identical keys

var t4 = new Top();
t4.add({key: 1, value: 'a'});
t4.add({key: 2, value: 'b'});
t4.add({key: 1, value: 'c'}, function(oldNode, newNode) {
  oldNode.value += newNode.value;
});

var l4 = t4.nodes;
Test.assertEquals(l4.length, 2);
Test.assertEquals(t4.nodes[0].value, 'b');
Test.assertEquals(t4.nodes[1].value, 'ac');

t4.remove(2);
Test.assertEquals(l4.length, 1);

// Test minDist and return value
var t5 = new Top('min', 0.5);
assert(t5.add({key: 1, value: 'a'}));
assert(t5.add({key: 2, value: 'b'}));
assert(t5.add({key: 1.5, value: 'c'}));
assert(!t5.add({key: 1.3, value: 'd'}));
assert(t5.add({key: 3, value: 'e'}));
Test.assertEquals(t5.nodes.length, 4);

// Test search for a gap in key range
var t6 = new Top('min', 0.5);
t6.add({key: 0.5, value: 'a'});
t6.add({key: 1.0, value: 'b'});
t6.add({key: 2.1, value: 'c'});
Test.assertApprox(t6.search(), 1.5);

var t7 = new Top('max', 0.09);
t7.add({key: 0.5, value: 'a'});
t7.add({key: 0.7, value: 'b'});
t7.add({key: 0.91, value: 'c'});
Test.assertApprox(t7.search(), 0.82);
t7.add({key: 0.81, value: 'd'});
Test.assertApprox(t7.search(), 0.61);

// No gaps until the end
var t8 = new Top('min', 0.0999999999);
t8.add({key: 0.5, value: 'a'});
t8.add({key: 0.6, value: 'b'});
t8.add({key: 0.7, value: 'c'});
Test.assertApprox(t8.search(), 0.8);

// Empty top returned undefined
var t9 = new Top('max', 0.1);
Test.assertEquals(t9.search(), undefined);
