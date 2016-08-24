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
var gm = require('gm');

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

var knownIds = [];

var twitterClient = new Twitter({
  consumer_key: 'ZZEt63oT45YmhmYYDVegAzpNn',
  consumer_secret: 'X6UQHGcZNc48uQJ5DPUVPCELEUk28wnuiCOATgQqZZ91W2uWOE',
  access_token_key: '768389002672177152-eFpDX83o3zyRBjuxjSZ0xo8aDXMtBKP',
  access_token_secret: 'eTPGYJG9hBXDVcAoXZVxAxj0fDDNyqWp5gv70hndCS59i'
});

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

webshotOptions = {
  screenSize: {
    width: 1024,
    height: 768
  }
}

var doShot = function(url, exp, dist, pok) {
  var that = this;
  that.url = url;
  that.pok = pok;
  that.exp = exp;
  that.dist = dist;
  that.onShot = function(err) {
    console.log('shot!')
    if (!err) {

 

	gm()
	    .in('-page', '+0+0')  // Custom place for each of the images
	    .in('media/tmp/'+that.pok.encounter_id+'.png')
	    .in('-page', '+50+350')
	    .in(getImg(that.pok.pokemon_id))
	    .mosaic()  // Merges the images as a matrix
	    .write('media/tmp/'+that.pok.encounter_id+'_icon.png', function (err) {
		if (err) console.log(err)
                else {

    var imgData = require('fs').readFileSync('media/tmp/'+that.pok.encounter_id+'_icon.png');
    console.log('tweeting');
    

    twitterClient.post('media/upload', {media: imgData}, function(error, media, response) {
      if(!error) {
        console.log(media);
        twitterClient.post('statuses/update',
          {
           status: that.pok.pokemon_id+'\nbis: '+that.exp.toLocaleTimeString()+'\n'+that.dist+'m von AC\n'+that.url,
           media_ids: media.media_id_string
          }, function(error, tweet, response) {
          if (!error) {
            console.log('tweeted');
          }
        });
      } else console.log(err);
    });



                }
	    });

    }
  };


  console.log( 'shooting!', that.url );
  webshot(that.url, 'media/tmp/'+that.pok.encounter_id+'.png', webshotOptions, that.onShot );
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

              var url = 'https://www.google.de/maps/place/'+poks[i].lnglat.coordinates[1]+'+'+poks[i].lnglat.coordinates[0]+'/'+poks[i].lnglat.coordinates[1]+','+poks[i].lnglat.coordinates[0];
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
    res.on('end', function(d) {
      getCache();
    });
	res.on('error', function(e) {
	      	  console.error(e);
		  setTimeout(function () {
		    getAPI();
		  }, 60*15*1000);
	 });
  });
  req.end();
  req.on('error', function(e) {
    console.error(e);
  });
}


var names = [
	"Bulbasaur",
	"Ivysaur",
	"Venusaur",
	"Charmander",
	"Charmeleon",
	"Charizard",
	"Squirtle",
	"Wartortle",
	"Blastoise",
	"Caterpie",
	"Metapod",
	"Butterfree",
	"Weedle",
	"Kakuna",
	"Beedrill",
	"Pidgey",
	"Pidgeotto",
	"Pidgeot",
	"Rattata",
	"Raticate",
	"Spearow",
	"Fearow",
	"Ekans",
	"Arbok",
	"Pikachu",
	"Raichu",
	"Sandshrew",
	"Sandslash",
	"Nidoran♀",
	"Nidorina",
	"Nidoqueen",
	"Nidoran♂",
	"Nidorino",
	"Nidoking",
	"Clefairy",
	"Clefable",
	"Vulpix",
	"Ninetales",
	"Jigglypuff",
	"Wigglytuff",
	"Zubat",
	"Golbat",
	"Oddish",
	"Gloom",
	"Vileplume",
	"Paras",
	"Parasect",
	"Venonat",
	"Venomoth",
	"Diglett",
	"Dugtrio",
	"Meowth",
	"Persian",
	"Psyduck",
	"Golduck",
	"Mankey",
	"Primeape",
	"Growlithe",
	"Arcanine",
	"Poliwag",
	"Poliwhirl",
	"Poliwrath",
	"Abra",
	"Kadabra",
	"Alakazam",
	"Machop",
	"Machoke",
	"Machamp",
	"Bellsprout",
	"Weepinbell",
	"Victreebel",
	"Tentacool",
	"Tentacruel",
	"Geodude",
	"Graveler",
	"Golem",
	"Ponyta",
	"Rapidash",
	"Slowpoke",
	"Slowbro",
	"Magnemite",
	"Magneton",
	"Farfetch’d",
	"Doduo",
	"Dodrio",
	"Seel",
	"Dewgong",
	"Grimer",
	"Muk",
	"Shellder",
	"Cloyster",
	"Gastly",
	"Haunter",
	"Gengar",
	"Onix",
	"Drowzee",
	"Hypno",
	"Krabby",
	"Kingler",
	"Voltorb",
	"Electrode",
	"Exeggcute",
	"Exeggutor",
	"Cubone",
	"Marowak",
	"Hitmonlee",
	"Hitmonchan",
	"Lickitung",
	"Koffing",
	"Weezing",
	"Rhyhorn",
	"Rhydon",
	"Chansey",
	"Tangela",
	"Kangaskhan",
	"Horsea",
	"Seadra",
	"Goldeen",
	"Seaking",
	"Staryu",
	"Starmie",
	"Mr. Mime",
	"Scyther",
	"Jynx",
	"Electabuzz",
	"Magmar",
	"Pinsir",
	"Tauros",
	"Magikarp",
	"Gyarados",
	"Lapras",
	"Ditto",
	"Eevee",
	"Vaporeon",
	"Jolteon",
	"Flareon",
	"Porygon",
	"Omanyte",
	"Omastar",
	"Kabuto",
	"Kabutops",
	"Aerodactyl",
	"Snorlax",
	"Articuno",
	"Zapdos",
	"Moltres",
	"Dratini",
	"Dragonair",
	"Dragonite",
	"Mewtwo",
	"Mew",
	"Chikorita",
	"Bayleef",
	"Meganium",
	"Cyndaquil",
	"Quilava",
	"Typhlosion",
	"Totodile",
	"Croconaw",
	"Feraligatr",
	"Sentret",
	"Furret",
	"Hoothoot",
	"Noctowl",
	"Ledyba",
	"Ledian",
	"Spinarak",
	"Ariados",
	"Crobat",
	"Chinchou",
	"Lanturn",
	"Pichu",
	"Cleffa",
	"Igglybuff",
	"Togepi",
	"Togetic",
	"Natu",
	"Xatu",
	"Mareep",
	"Flaaffy",
	"Ampharos",
	"Bellossom",
	"Marill",
	"Azumarill",
	"Sudowoodo",
	"Politoed",
	"Hoppip",
	"Skiploom",
	"Jumpluff",
	"Aipom",
	"Sunkern",
	"Sunflora",
	"Yanma",
	"Wooper",
	"Quagsire",
	"Espeon",
	"Umbreon",
	"Murkrow",
	"Slowking",
	"Misdreavus",
	"Unown",
	"Wobbuffet",
	"Girafarig",
	"Pineco",
	"Forretress",
	"Dunsparce",
	"Gligar",
	"Steelix",
	"Snubbull",
	"Granbull",
	"Qwilfish",
	"Scizor",
	"Shuckle",
	"Heracross",
	"Sneasel",
	"Teddiursa",
	"Ursaring",
	"Slugma",
	"Magcargo",
	"Swinub",
	"Piloswine",
	"Corsola",
	"Remoraid",
	"Octillery",
	"Delibird",
	"Mantine",
	"Skarmory",
	"Houndour",
	"Houndoom",
	"Kingdra",
	"Phanpy",
	"Donphan",
	"Porygon2",
	"Stantler",
	"Smeargle",
	"Tyrogue",
	"Hitmontop",
	"Smoochum",
	"Elekid",
	"Magby",
	"Miltank",
	"Blissey",
	"Raikou",
	"Entei",
	"Suicune",
	"Larvitar",
	"Pupitar",
	"Tyranitar",
	"Lugia",
	"Ho-Oh",
	"Celebi",
	"Treecko",
	"Grovyle",
	"Sceptile",
	"Torchic",
	"Combusken",
	"Blaziken",
	"Mudkip",
	"Marshtomp",
	"Swampert",
	"Poochyena",
	"Mightyena",
	"Zigzagoon",
	"Linoone",
	"Wurmple",
	"Silcoon",
	"Beautifly",
	"Cascoon",
	"Dustox",
	"Lotad",
	"Lombre",
	"Ludicolo",
	"Seedot",
	"Nuzleaf",
	"Shiftry",
	"Taillow",
	"Swellow",
	"Wingull",
	"Pelipper",
	"Ralts",
	"Kirlia",
	"Gardevoir",
	"Surskit",
	"Masquerain",
	"Shroomish",
	"Breloom",
	"Slakoth",
	"Vigoroth",
	"Slaking",
	"Nincada",
	"Ninjask",
	"Shedinja",
	"Whismur",
	"Loudred",
	"Exploud",
	"Makuhita",
	"Hariyama",
	"Azurill",
	"Nosepass",
	"Skitty",
	"Delcatty",
	"Sableye",
	"Mawile",
	"Aron",
	"Lairon",
	"Aggron",
	"Meditite",
	"Medicham",
	"Electrike",
	"Manectric",
	"Plusle",
	"Minun",
	"Volbeat",
	"Illumise",
	"Roselia",
	"Gulpin",
	"Swalot",
	"Carvanha",
	"Sharpedo",
	"Wailmer",
	"Wailord",
	"Numel",
	"Camerupt",
	"Torkoal",
	"Spoink",
	"Grumpig",
	"Spinda",
	"Trapinch",
	"Vibrava",
	"Flygon",
	"Cacnea",
	"Cacturne",
	"Swablu",
	"Altaria",
	"Zangoose",
	"Seviper",
	"Lunatone",
	"Solrock",
	"Barboach",
	"Whiscash",
	"Corphish",
	"Crawdaunt",
	"Baltoy",
	"Claydol",
	"Lileep",
	"Cradily",
	"Anorith",
	"Armaldo",
	"Feebas",
	"Milotic",
	"Castform",
	"Kecleon",
	"Shuppet",
	"Banette",
	"Duskull",
	"Dusclops",
	"Tropius",
	"Chimecho",
	"Absol",
	"Wynaut",
	"Snorunt",
	"Glalie",
	"Spheal",
	"Sealeo",
	"Walrein",
	"Clamperl",
	"Huntail",
	"Gorebyss",
	"Relicanth",
	"Luvdisc",
	"Bagon",
	"Shelgon",
	"Salamence",
	"Beldum",
	"Metang",
	"Metagross",
	"Regirock",
	"Regice",
	"Registeel",
	"Latias",
	"Latios",
	"Kyogre",
	"Groudon",
	"Rayquaza",
	"Jirachi",
	"Deoxys",
	"Turtwig",
	"Grotle",
	"Torterra",
	"Chimchar",
	"Monferno",
	"Infernape",
	"Piplup",
	"Prinplup",
	"Empoleon",
	"Starly",
	"Staravia",
	"Staraptor",
	"Bidoof",
	"Bibarel",
	"Kricketot",
	"Kricketune",
	"Shinx",
	"Luxio",
	"Luxray",
	"Budew",
	"Roserade",
	"Cranidos",
	"Rampardos",
	"Shieldon",
	"Bastiodon",
	"Burmy",
	"Wormadam",
	"Mothim",
	"Combee",
	"Vespiquen",
	"Pachirisu",
	"Buizel",
	"Floatzel",
	"Cherubi",
	"Cherrim",
	"Shellos",
	"Gastrodon",
	"Ambipom",
	"Drifloon",
	"Drifblim",
	"Buneary",
	"Lopunny",
	"Mismagius",
	"Honchkrow",
	"Glameow",
	"Purugly",
	"Chingling",
	"Stunky",
	"Skuntank",
	"Bronzor",
	"Bronzong",
	"Bonsly",
	"Mime Jr.",
	"Happiny",
	"Chatot",
	"Spiritomb",
	"Gible",
	"Gabite",
	"Garchomp",
	"Munchlax",
	"Riolu",
	"Lucario",
	"Hippopotas",
	"Hippowdon",
	"Skorupi",
	"Drapion",
	"Croagunk",
	"Toxicroak",
	"Carnivine",
	"Finneon",
	"Lumineon",
	"Mantyke",
	"Snover",
	"Abomasnow",
	"Weavile",
	"Magnezone",
	"Lickilicky",
	"Rhyperior",
	"Tangrowth",
	"Electivire",
	"Magmortar",
	"Togekiss",
	"Yanmega",
	"Leafeon",
	"Glaceon",
	"Gliscor",
	"Mamoswine",
	"Porygon-Z",
	"Gallade",
	"Probopass",
	"Dusknoir",
	"Froslass",
	"Rotom",
	"Uxie",
	"Mesprit",
	"Azelf",
	"Dialga",
	"Palkia",
	"Heatran",
	"Regigigas",
	"Giratina",
	"Cresselia",
	"Phione",
	"Manaphy",
	"Darkrai",
	"Shaymin",
	"Arceus",
	"Victini",
	"Snivy",
	"Servine",
	"Serperior",
	"Tepig",
	"Pignite",
	"Emboar",
	"Oshawott",
	"Dewott",
	"Samurott",
	"Patrat",
	"Watchog",
	"Lillipup",
	"Herdier",
	"Stoutland",
	"Purrloin",
	"Liepard",
	"Pansage",
	"Simisage",
	"Pansear",
	"Simisear",
	"Panpour",
	"Simipour",
	"Munna",
	"Musharna",
	"Pidove",
	"Tranquill",
	"Unfezant",
	"Blitzle",
	"Zebstrika",
	"Roggenrola",
	"Boldore",
	"Gigalith",
	"Woobat",
	"Swoobat",
	"Drilbur",
	"Excadrill",
	"Audino",
	"Timburr",
	"Gurdurr",
	"Conkeldurr",
	"Tympole",
	"Palpitoad",
	"Seismitoad",
	"Throh",
	"Sawk",
	"Sewaddle",
	"Swadloon",
	"Leavanny",
	"Venipede",
	"Whirlipede",
	"Scolipede",
	"Cottonee",
	"Whimsicott",
	"Petilil",
	"Lilligant",
	"Basculin",
	"Sandile",
	"Krokorok",
	"Krookodile",
	"Darumaka",
	"Darmanitan",
	"Maractus",
	"Dwebble",
	"Crustle",
	"Scraggy",
	"Scrafty",
	"Sigilyph",
	"Yamask",
	"Cofagrigus",
	"Tirtouga",
	"Carracosta",
	"Archen",
	"Archeops",
	"Trubbish",
	"Garbodor",
	"Zorua",
	"Zoroark",
	"Minccino",
	"Cinccino",
	"Gothita",
	"Gothorita",
	"Gothitelle",
	"Solosis",
	"Duosion",
	"Reuniclus",
	"Ducklett",
	"Swanna",
	"Vanillite",
	"Vanillish",
	"Vanilluxe",
	"Deerling",
	"Sawsbuck",
	"Emolga",
	"Karrablast",
	"Escavalier",
	"Foongus",
	"Amoonguss",
	"Frillish",
	"Jellicent",
	"Alomomola",
	"Joltik",
	"Galvantula",
	"Ferroseed",
	"Ferrothorn",
	"Klink",
	"Klang",
	"Klinklang",
	"Tynamo",
	"Eelektrik",
	"Eelektross",
	"Elgyem",
	"Beheeyem",
	"Litwick",
	"Lampent",
	"Chandelure",
	"Axew",
	"Fraxure",
	"Haxorus",
	"Cubchoo",
	"Beartic",
	"Cryogonal",
	"Shelmet",
	"Accelgor",
	"Stunfisk",
	"Mienfoo",
	"Mienshao",
	"Druddigon",
	"Golett",
	"Golurk",
	"Pawniard",
	"Bisharp",
	"Bouffalant",
	"Rufflet",
	"Braviary",
	"Vullaby",
	"Mandibuzz",
	"Heatmor",
	"Durant",
	"Deino",
	"Zweilous",
	"Hydreigon",
	"Larvesta",
	"Volcarona",
	"Cobalion",
	"Terrakion",
	"Virizion",
	"Tornadus",
	"Thundurus",
	"Reshiram",
	"Zekrom ",
	"Landorus",
	"Kyurem",
	"Keldeo",
	"Meloetta",
	"Genesect",
	"Chespin",
	"Quilladin",
	"Chesnaught",
	"Fennekin",
	"Braixen",
	"Delphox",
	"Froakie",
	"Frogadier",
	"Greninja",
	"Bunnelby",
	"Diggersby",
	"Fletchling",
	"Fletchinder",
	"Talonflame",
	"Scatterbug",
	"Spewpa",
	"Vivillon",
	"Litleo",
	"Pyroar",
	"Flabebe",
	"Floette",
	"Florges",
	"Skiddo",
	"Gogoat",
	"Pancham",
	"Pangoro",
	"Furfrou",
	"Espurr",
	"Meowstic",
	"Honedge",
	"Doublade",
	"Aegislash",
	"Spritzee",
	"Aromatisse",
	"Swirlix",
	"Slurpuff",
	"Inkay",
	"Malamar",
	"Binacle",
	"Barbaracle",
	"Skrelp",
	"Dragalge",
	"Clauncher",
	"Clawitzer",
	"Helioptile",
	"Heliolisk",
	"Tyrunt",
	"Tyrantrum",
	"Amaura",
	"Aurorus",
	"Sylveon",
	"Hawlucha",
	"Dedenne",
	"Carbink",
	"Goomy",
	"Sliggoo",
	"Goodra",
	"Klefki",
	"Phantump",
	"Trevenant",
	"Pumpkaboo",
	"Gourgeist",
	"Bergmite",
	"Avalugg",
	"Noibat",
	"Noivern",
	"Xerneas",
	"Yveltal",
	"Zygarde",
	"Diancie",
	"Hoopa",
	"Volcanion"
];
for(var i=0;i<names.length;i++){
    names[i]=names[i].toUpperCase().replace('.','').replace(' ','_');
}
function getImg(name){
  var id = names.indexOf(name);
  if (id==-1) {
    return 'media/pokemon/unknown.png';
  }
  return 'media/pokemon/main-sprites/red-blue/300/'+(id+1)+'.png';
}


getAPI();
