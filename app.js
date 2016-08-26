'use strict';

var api = require('./api');

var UPDATE_OFFSET = 1000*2*60;

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

api.update();
setTimeout(function () {
  api.update();
}, UPDATE_OFFSET);
