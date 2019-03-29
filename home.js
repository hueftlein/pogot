'use strict';

var HOME_LATITUDE = 48.152033;
var HOME_LONGITUDE = 11.536544;

exports.getExact = function() {
  return {
    latitude: HOME_LATITUDE,
    longitude: HOME_LONGITUDE
  };
}

exports.getRandom = function() {
  var min = -200,
      max =  200,
      randomLatitudeOffset =  (Math.floor(Math.random() * (max - min + 1)) + min)/1000000000000,
      randomLongitudeOffset = (Math.floor(Math.random() * (max - min + 1)) + min)/1000000000000;
  return {
    latitude: HOME_LATITUDE + randomLatitudeOffset,
    longitude: HOME_LONGITUDE + randomLongitudeOffset
  };
}
