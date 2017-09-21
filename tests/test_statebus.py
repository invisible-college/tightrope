// Test calls to statebus server
var bus = require('statebus/server')();
bus.ws_client("/*", "ws://aws.local-box.org:45678");
x = bus.fetch("/paul/code");
console.log(JSON.stringify(x));
if (!x.written) {
  console.log("No member .written found, setting it now");
  x.written = "here it is";
}
save(x);

