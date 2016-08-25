'use strict';

var home = require('./home');
var https = require('https');
var pokemon = require('./pokemon');

var getOptions = function(host) {
  var homeLoc = home.getRandom();
  return {
    hostname: '%hst.fastpokemap.se'.replace(/%hst/g,host),
    port: 443,
    method: 'GET',
    path: "/?key=678766ade6cca6165ff6ca6fb72aa4b0&ts=1472127126&compute=82.135.63.117&lat=%lat&lng=%lng".replace(/%lat/g,homeLoc.latitude).replace(/%lng/g,homeLoc.longitude),
    headers: {
      ":authority": "%hst.fastpokemap.se".replace(/%hst/g,host),
      ":method": "GET",
      ":path": "/?lat=%lat&lng=%lng".replace(/%lat/g,homeLoc.latitude).replace(/%lng/g,homeLoc.longitude),
      ":scheme": "https",
      "accept":"application/json, text/javascript, */*; q=0.01",
      "accept-language":"de-DE,de;q=0.8,en-US;q=0.6,en;q=0.4",
      "cache-control":"no-cache",
      "origin":"https://fastpokemap.se",
      "pragma":"no-cache",
      "user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36"
    }
  };
};

var getApi = function() {
  console.log('getting api');

  var options = getOptions('api');
  var req = https.request(options, function(res) {
    res.on('data', function(d) {
      console.log('got api');
      getCache();
    });
    res.on('error', function(err) {
      console.error(err);
    });
  });
  req.end();
  req.on('error', function(err) {
    console.error(err);
  });
}

var getCache = function() {
  console.log('getting cache');
  var options = getOptions('cache');
  var req = https.request(options, function(res) {
    var response = [];
    res.on('data', function(chunk) {
      response.push(chunk);
    });
    res.on('end', function() {
      console.log('got cache');
      try {
        var result = JSON.parse(response.join(''));
      } catch(err) {
        throw new Error(err);
      }
      if ( typeof result != 'object' || !result.length ) {
        console.log(response.join(''));
        throw new Error('Error parsing result!');
      }
      for(var i=0;i<result.length;i++) {
        try {
          var cachedPokemon = {
            encounter_id: result[i].encounter_id,
            pokemon_id: result[i].pokemon_id,
            expiresAt: new Date(result[i].expireAt),
            location: {
              latitude: result[i].lnglat.coordinates[1],
              longitude: result[i].lnglat.coordinates[0]
            }
          }
          pokemon.add(cachedPokemon);
        } catch(err) {
          console.log('Error parsing Pokemon!', err);
        }
      }
      pokemon.publish();
    });
  });
  req.end();
  req.on('error', function(err) {
    console.error(err);
  });
};

exports.update = function() {
  getApi();
};
