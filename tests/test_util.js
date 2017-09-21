var Test = require('../lib/test');

Test.assertEquals(Test.isNothing(Math.pow(10,-8)), false);
Test.assertEquals(Test.isNothing(Math.pow(10,-9)), false);
Test.assertEquals(Test.isNothing(Math.pow(10,-10)), true);
