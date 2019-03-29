'use strict';

var fs = require('fs');
var names = require('./names');
var image = require('./image');
var Twitter = require('twitter');
var getenv = require('getenv');

var GMAPS_BASE_URL = 'https://www.google.de/maps/place/%lat+%lng/%lat,%lng';

var twitterClient;

try {
  twitterClient = new Twitter({
    consumer_key: getenv('TWITTER_CONSUMER_KEY'),
    consumer_secret: getenv('TWITTER_CONSUMER_SECRET'),
    access_token_key: getenv('TWITTER_TOKEN_KEY'),
    access_token_secret: getenv('TWITTER_TOKEN_SECRET')
  });
} catch(e) {
  console.log('Error creating twitterClient. Missing environment vars?',e);
  process.exit(1);
}

exports.Post = function (pokemon, callback) {
  console.log('tweeting!');
  image.create(pokemon, function(path) {
    var img = require('fs').readFileSync(path);
    twitterClient.post('media/upload', { media: img }, function(err, media, response) {
      if (err) { throw new Error(err); }
      var tweetData = {
        status: names.numToName(names.idToNum(pokemon.pokemon_id)) +
                '\nbis: ' + pokemon.expiresAt.toLocaleTimeString() +
                '\n' + pokemon.distance + 'm von AC\n' +
                GMAPS_BASE_URL.replace(/%lat/g,pokemon.location.latitude).replace(/%lng/g,pokemon.location.longitude),
        media_ids: media.media_id_string
      };
      fs.unlinkSync(path);
      twitterClient.post('statuses/update', tweetData, function(err, tweet, response) {
        if (err) { throw new Error(err); }
        console.log('tweeted!');
        if ( typeof callback == 'function' ) {
          callback(pokemon);
        }
      });
    });
  });
};
