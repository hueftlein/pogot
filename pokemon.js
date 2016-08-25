'use strict';

var mongoose = require('mongoose');
var geolib = require('geolib');
var tweet = require('./tweet');
var home = require('./home');

mongoose.connect('mongodb://localhost/pokemons');

var pokemonSchema = new mongoose.Schema({
  encounter_id: String,
  pokemon_id: String,
  expiresAt: Date,
  location: {
    latitude: Number,
    longitude: Number
  },
  distance: Number,
  tweeted: { type: Date, default: null }
});

pokemonSchema.pre('save', function(next) {
  this.distance = geolib.getDistance(
    { latitude: this.location.latitude, longitude: this.location.longitude },
    home.getExact()
  );
  console.log('Distance: '+this.distance);
  next();
});

var Pokemon = mongoose.model( 'Pokemon', pokemonSchema );

exports.add = function(pokemon) {
  Pokemon.find({encounter_id: pokemon.encounter_id}, function(err, pokemons) {
    if (!pokemons.length) {
      var newPokemon = new Pokemon(pokemon);
      newPokemon.save(function(err) {
        if (err) { throw new Error(err); }
        console.log('added Pokemon!');
      });
    }
  });
};

exports.publish = function() {
  Pokemon.find({tweeted: null, distance:{$lt: 2500}}, function(err, pokemons) {
    if (err) { throw new Error(err); }
    console.log('post',pokemons.length);
    for(var i=0;i<pokemons.length;i++) {
      try {
        new tweet.Post(pokemons[i], function(pokemon) {
          console.log(pokemon.encounter_id);
          var query = { encounter_id: pokemon.encounter_id };
          var newData = { tweeted: new Date() };
          Pokemon.findOneAndUpdate(query, newData, function(err, doc) {
            if (err) { throw new Error(err); }
            console.log('tweet saved!');
          });
        });
      } catch (err) {
        console.log(err);
      }
    }
  });
};
