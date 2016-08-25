'use strict';

var webshot = require('webshot');
var names = require('./names');
var gm = require('gm');
var fs = require('fs');

var GMAPS_BASE_URL = 'https://www.google.de/maps/place/%lat+%lng/%lat,%lng';
var MEDIA_FOLDER = 'media/tmp/';
var GMAPS_OPTIONS = {
  screenSize: {
    width: 1024,
    height: 768
  }
}

var Image = function(pokemon, callback) {
  console.log('shooting!');
  var onShot = function(err) {
    var path = MEDIA_FOLDER + pokemon.encounter_id+'_final.png';
    if (err) { throw new Error(err); }
    console.log('shot!');
    gm()
      .in('-page', '+0+0')
      .in(gmapsPath)
      .in('-page', '+50+350')
      .in( names.getImg(names.idToNum(pokemon.pokemon_id)) )
      .mosaic()
      .fill('#ffffff')
      .drawText(18, 315, names.numToName(names.idToNum(pokemon.pokemon_id)))
      .fontSize( '40px' )
      .write(path, function (err) {
        if (err) { throw new Error(err); }
        fs.unlinkSync(gmapsPath);
        callback(path);
      });
  };
  var gmapsUrl = GMAPS_BASE_URL.replace(/%lat/g,pokemon.location.latitude).replace(/%lng/g,pokemon.location.longitude);
  var gmapsPath = MEDIA_FOLDER + pokemon.encounter_id+'.png';
  webshot(gmapsUrl, gmapsPath, GMAPS_OPTIONS, onShot);
};

exports.create = function (pokemon, callback) {
  new Image(pokemon, callback);
}
