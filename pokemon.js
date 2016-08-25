'use strict';

var mongoose = require('mongoose');
var geolib = require('geolib');
var tweet = require('./tweet');

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
    { latitude: 48.15219761119932, longitude: 11.536357998847963 }
  );
  next();
});

var Pokemon = mongoose.model( 'Pokemon', pokemonSchema );

exports.add = function(pokemon) {
  Pokemon.find({encounter_id: pokemon.encounter_id}, function(err, pokemons) {
    if (!pokemons.length) {
      var newPokemon = new Pokemon(pokemon);
      newPokemon.save(function(err) {
        if (err) { throw new Error(err); }
      });
    }
  });
};

exports.publish = function() {
  Pokemon.find({tweeted: null}, function(err, pokemons) { //, distance:{$lt: 1000}
    if (err) { throw new Error(err); }
    for(var i=0;i<pokemons.length;i++) {
      try {
        tweet.post(pokemons[i]);
        var query = { encounter_id: pokemons[i].encounter_id };
        var newData = { tweeted: new Date() };
        Pokemon.findOneAndUpdate(query, newData, function(err, doc) {
          if (err) { throw new Error(err); }
          console.log('tweet saved!');
        });
      } catch (err) {
        console.log(err);
      }
    }
  });
};
