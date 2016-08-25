
var https = require('https');
var names = require('./names');
var pokemon = require('./pokemon');
var image = require('./image');


process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

var knownIds = [];

var randomLat;
var randomLng;

var lat = 48.152197611199;
var lng = 11.5363579988479;

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


var doShot = function(url, exp, dist, pok) {
  var that = this;
  that.url = url;
  that.pok = pok;
  that.exp = exp;
  that.dist = dist;
  that.onShot = function(err) {
    console.log('shot!')
    if (!err) {






    } else {
      console.log(err);
    }
  };


  console.log( 'shooting!', that.url );
  return that;
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

              //var url = ;
              console.log( url );
              var dist = geolib.getDistance(
                  {latitude: poks[i].lnglat.coordinates[1], longitude: poks[i].lnglat.coordinates[0]},
                  {latitude: 48.15219761119932, longitude: 11.536357998847963}
              );
              console.log(dist);
              if (dist<=1000) {

                var exp = new Date(poks[i].expireAt);
                new doShot(url, exp, dist, poks[i]);
                /*console.log('tweeting!');
		twitterClient.post('statuses/update', {status: poks[i].pokemon_id+'\nbis: '+exp.toLocaleTimeString()+'\n'+dist+'m von AC\n'+url}, function(error, tweet, response) {
		  if (!error) {
		    console.log('tweeted');
		  } else {
		    console.log(error);
		  }
		});*/

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

  var min = 10000;
  var max = 30000;
  var rdmW = Math.floor(Math.random() * (max - min + 1)) + min;
  setTimeout(function () {
    getAPI();
  }, 60*5*1000+rdmW);

}
function getAPI() {
  console.log('getting data');
  var min = 1;
  var max = 19;
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
    res.on('error', function(e) {
       console.error(e);
    });
  });
  req.end();
  req.on('error', function(e) {
    console.error(e);
  });
}

//getAPI();
//doShot('https://www.google.de/', new Date(0), '0', {pokemon_id: 'BULBASAUR', encounter_id: '1' } );

var testPkm = {
  encounter_id: 'aaa10',
  expiresAt: new Date(0),
  location: {
    latitude: 11.5373131,
    longitude: 48.1521076
  },
  pokemon_id: 'BULBASAUR'
};

pokemon.add(testPkm);
pokemon.publish();
//tweet.post(testPkm)
