'use strict';

var fs = require('fs');
var names = require('./names');
var image = require('./image');
var Twitter = require('twitter');

var twitterClient = new Twitter({
  consumer_key: 'ZZEt63oT45YmhmYYDVegAzpNn',
  consumer_secret: 'X6UQHGcZNc48uQJ5DPUVPCELEUk28wnuiCOATgQqZZ91W2uWOE',
  access_token_key: '768389002672177152-eFpDX83o3zyRBjuxjSZ0xo8aDXMtBKP',
  access_token_secret: 'eTPGYJG9hBXDVcAoXZVxAxj0fDDNyqWp5gv70hndCS59i'
});

exports.post = function (pokemon) {
  console.log('tweeting!');
  image.create(pokemon, function(path) {
    var img = require('fs').readFileSync(path);
    twitterClient.post('media/upload', { media: img }, function(err, media, response) {
      if (err) { throw new Error(err); }
      var tweetData = {
        status: names.numToName(names.idToNum(pokemon.pokemon_id)) + '\nbis: ' + pokemon.expiresAt.toLocaleTimeString() + '\n' + pokemon.dist+'m von AC\n',
        media_ids: media.media_id_string
      };
      twitterClient.post('statuses/update', tweetData, function(err, tweet, response) {
        if (err) { throw new Error(err); }
        console.log('tweeted!');
      });
    });
  });
};
