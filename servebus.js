// Simply serves the db in the current directory on
// http://localhost:12345
// Open up testbus.html to poke at it.

var bus = require('./lib/statebus/server')();

bus.serve({port: 12345});
