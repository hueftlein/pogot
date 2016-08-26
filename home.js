'use strict';

var HOME_LATITUDE = 48.15219761119932;
var HOME_LONGITUDE = 11.536357998847963;

exports.getExact = function() {
  return {
    latitude: HOME_LATITUDE,
    longitude: HOME_LONGITUDE
  };
}

exports.getRandom = function() {
  var min = -200,
      max =  200,
      randomLatitudeOffset =  (Math.floor(Math.random() * (max - min + 1)) + min)/10000000000000,
      randomLongitudeOffset = (Math.floor(Math.random() * (max - min + 1)) + min)/10000000000000;
  return {
    latitude: HOME_LATITUDE, //+ randomLatitudeOffset,
    longitude: HOME_LONGITUDE //+ randomLongitudeOffset
  };
}
