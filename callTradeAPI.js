// Test file to call the trading API

var https = require('https');
var request = require('request');
var querystring = require('querystring');
var sha512 = require('sha512');
var nonce = require('nonce')();

var NONCE = nonce();
config = configJson(configFile)
API_KEY = config['apiKey']
SECRET = config['secret']

var postData = querystring.stringify({command: "returnBalances", nonce: NONCE});

var hasher = sha512.hmac(SECRET);
var paramString = Object.keys(postData).map(function(param){
                return encodeURIComponent(param) + '=' + encodeURIComponent(postData[param]);
            }).join('&');

var hash = hasher.finalize(postData);

var options = {
  url: 'https://poloniex.com/tradingApi',
  host: 'poloniex.com',
  path: '/tradingApi',
  //since we are listening on a custom port, we need to specify it by hand
  port: '443',
  STRICT_SSL: false,
  //This is what changes the request to a POST request
  method: 'POST',
  json: true,
  form: postData,
  headers: {Key: API_KEY, Sign: hash.toString('hex')}
};

/* Callback for https.request */
callback = function(err, response, body) {
  var str = ''
  response.on('data', function (chunk) {
    str += chunk;
  });

  response.on('end', function () {
    console.log(str);
  });
};

var req = request(options, function(err, response, body) {
  console.log(err);
  //console.log(response);
  console.log(body);
});
//This is the data we are posting, it needs to be a string or a buffer
//req.write(postData);
//req.end();
