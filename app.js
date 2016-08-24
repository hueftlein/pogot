var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var webshot = require('webshot');
var Twitter = require('twitter');
var https = require('https');
var geolib = require('geolib');

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

var knownIds = [];

var twitterClient = new Twitter({
  consumer_key: 'fuuf2SaxPz4J0kTqlapSprrZJ',
  consumer_secret: '3g6xkBtqQKxyKEsuTBWQ00WkQQTLMGSuWwI8dCS7VAKq3udNy6',
  access_token_key: '768389002672177152-VCIed1MHyTMniEor0Yg3U7p3jSk4Uhd',
  access_token_secret: 'EW9jXneBDe4DscJlnzS99InnfzEoL0NjogmIE5MrepWSU'
});

var randomLat;
var randomLng;

var lat = 48.1521976111993;
var lng = 11.53635799884796;

var httpsOptionsCache = {
  hostname: 'cache.fastpokemap.se',
  port: 443,
  method: 'GET',
  path: "/?lat=48.15219761119932&lng=11.536357998847963",
  headers: {
    ":authority": "cache.fastpokemap.se",
    ":method": "GET",
    ":path": "/?lat=48.15219761119932&lng=11.536357998847963",
    ":scheme": "https",
    "accept":"application/json, text/javascript, */*; q=0.01",
    "accept-language":"de-DE,de;q=0.8,en-US;q=0.6,en;q=0.4",
    "cache-control":"no-cache",
    "origin":"https://fastpokemap.se",
    "pragma":"no-cache",
    "user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36"
  }
};
var httpsOptionsAPI = {
  hostname: 'api.fastpokemap.se',
  port: 443,
  method: 'GET',
  path: "/?lat=48.15219761119932&lng=11.536357998847963",
  headers: {
    ":authority": "api.fastpokemap.se",
    ":method": "GET",
    ":path": "/?lat=48.15219761119932&lng=11.536357998847963",
    ":scheme": "https",
    "accept":"application/json, text/javascript, */*; q=0.01",
    "accept-language":"de-DE,de;q=0.8,en-US;q=0.6,en;q=0.4",
    "cache-control":"no-cache",
    "origin":"https://fastpokemap.se",
    "pragma":"no-cache",
    "user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36"
  }
};

webshotOptions = {
  screenSize: {
    width: 320,
    height: 480
  }
}

function getCache() {
  console.log('getting cache');
  var poks = [];
  var response = [];
  var req = https.request(httpsOptionsCache, function(res) {

    res.on('data', function(chunk) {
      response.push(chunk);
    });

    res.on('end', function() {
      console.log('got cache');
      var d = response.join('');
      if ( typeof d == 'string' ) {

      try {
        var result = JSON.parse(d);
      } catch(e) {
        console.log('error');
        console.log(e);
        console.log(d);
      }

          if ( typeof result == 'object' && result.length ) {

            for(var i=0;i<result.length;i++) {
              if ( result[i].lnglat && result[i].lnglat.coordinates && result[i].lnglat.coordinates[1] && result[i]["pokemon_id"] && result[i].encounter_id && knownIds.indexOf(result[i].encounter_id) == -1 ) {
                poks.push( result[i] );
                knownIds.push( result[i].encounter_id );
              }
            }

            for(var i=0;i<poks.length;i++) {

              var url = 'https://www.google.de/maps/@'+poks[i].lnglat.coordinates[1]+','+poks[i].lnglat.coordinates[0]+',19z?hl=de';
              console.log( url );
              //webshot(url, 'google.png', webshotOptions, function(err) {
              //  // screenshot now saved to google.png
              //});
              var dist = geolib.getDistance(
                  {latitude: poks[i].lnglat.coordinates[1], longitude: poks[i].lnglat.coordinates[0]},
                  {latitude: 48.15219761119932, longitude: 11.536357998847963}
              );
              console.log(dist);  //expireAt: '2016-08-24T12:22:50.428Z'
              if (dist<1000) {
                var exp = new Date(poks[i].expireAt);
                twitterClient.post('statuses/update', {status: poks[i].pokemon_id+'\nbis: '+exp.toLocaleTimeString()+'\n'+dist+'m von AC\n'+url}, function(error, tweet, response) {
                  if (!error) {
                    console.log('tweeted');
                  }
                });
              }

            }

          } else {
            //process.stdout.write(d);
            console.log('err');
          }


        } else {
          console.log(typeof d);
        }

    });
  });
  req.end();
  req.on('error', function(e) {
    console.log(e);
  });

  var min = 1000;
  var max = 2000;
  var rdmW = Math.floor(Math.random() * (max - min + 1)) + min;
  setTimeout(function () {
    getAPI();
  }, 60*5*1000+rdmW);

}
function getAPI() {
  console.log('getting data');
  var min = 0;
  var max = 10;
  randomLat = Math.floor(Math.random() * (max - min + 1)) + min;
  randomLng = Math.floor(Math.random() * (max - min + 1)) + min;

  httpsOptionsCache.path= "/?lat="+lat+randomLat+"&lng="+lng+randomLng;
  httpsOptionsCache.headers[":path"]= "/?lat="+lat+randomLat+"&lng="+lng+randomLng;

  httpsOptionsAPI.path= "/?lat="+lat+randomLat+"&lng="+lng+randomLng;
  httpsOptionsAPI.headers[":path"]= "/?lat="+lat+randomLat+"&lng="+lng+randomLng;

  var poks = [];
  var req = https.request(httpsOptionsAPI, function(res) {
    res.on('data', function(d) {
      getCache();
    });
  });
  req.end();
  req.on('error', function(e) {
    console.error(e);
  });
}


getAPI();
