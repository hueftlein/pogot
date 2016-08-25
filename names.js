'use strict';

var names = {
  de: require('./data/names-de.json'),
  en: require('./data/names-en.json'),
  id: []
}

for (var i=0;i<names.en.length;i++) {
  names.id[i]=names.en[i].toUpperCase().replace('.','').replace(' ','_');
}

exports.idToNum = function ( id ) {
  var num = names.id.indexOf(id)+1;
  if ( num === 0 ) {
    throw new Error('ID not found!');
  }
  return (num);
};

exports.getImg = function ( num ) {
  return 'media/pokemon/main-sprites/red-blue/300/'+num+'.png';
}

exports.numToName= function ( num, lang ) {
  if (!lang) {
    lang = 'de';
  }
  if ( !names[lang] ) {
    throw new Error('Unknown language!');
  }
  var name = names[lang][num-1];
  if ( !name ) {
    throw new Error('Unknown number!');
  }
  return name;
}
