'use strict';

var api = require('./api');

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

api.update();
