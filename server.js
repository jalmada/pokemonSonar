'use strict';

var PokemonGO = require('./node_modules/pokemon-go-node-api/poke.io.js');
var nodemailer = require('nodemailer');
var util = require('util');
var fs = require("fs");

var a = new PokemonGO.Pokeio();

var locations = JSON.parse(fs.readFileSync('locations.json', 'utf8'));
var configuration = JSON.parse(fs.readFileSync('configuration.json', 'utf8'));

var user = configuration.user;
var wantedPokemon = configuration.wantedPokemon;

var pokemonFound = [];

var username = process.env.PGO_USERNAME || user.name;
var password = process.env.PGO_PASSWORD || user.password;
var provider = process.env.PGO_PROVIDER || user.provider;


var currentlocation = 0;


a.init(username, password, locations[currentlocation], provider, function(err) {
    if (err) throw err;

    console.log(`1[i] Current location: ${a.playerInfo.locationName}`);
    console.log(`1[i] lat/long/alt: ${a.playerInfo.latitude}, ${a.playerInfo.longitude}, ${a.playerInfo.altitude}`);

    a.GetProfile(function(err, profile) {
        if (err) throw err;

        console.log(`1[i] Username: ${profile.username}`);
        console.log(`1[i] Poke Storage: ${profile.poke_storage}`);
        console.log(`1[i] Item Storage: ${profile.item_storage}`);

        var poke = 0;
        if (profile.currency[0].amount) {
            poke = profile.currency[0].amount;
        }

        console.log('1[i] Pokecoin: ' + poke);
        console.log('1[i] Stardust: ' + profile.currency[1].amount);

        setInterval(function(){          
            
            a.Heartbeat(function (err, hb) {

                        var mapPokemon = [];                    
                        
                        if (err) {
                            console.log(err);
                            return callback({ nearbyPokemon : nearbyPokemon });
                        };

                        console.log(`Checking: ${a.playerInfo.locationName}`);
                        
                        for (var i = hb.cells.length - 1; i >= 0; i--) {

                            hb.cells[i].NearbyPokemon.forEach(function(nearby) {
                                //console.log(util.inspect(nearby, {showHidden: false, depth: null}));
                                let pokemon = a.pokemonlist[parseInt(nearby.PokedexNumber) - 1];
                                mapPokemon.push(pokemon);
                                console.log(`[+] ${nearby.EncounterId}: There is a ${pokemon.name} nearby` );
                            }, this);
                            
                            hb.cells[i].MapPokemon.forEach(function(map) {
                                //console.log(util.inspect(map, {showHidden: false, depth: null}));
                                let pokemon = a.pokemonlist[parseInt(map.PokedexTypeId) - 1];
                                mapPokemon.push(pokemon);
                                console.log(`[+] ${map.EncounterId}: There is a ${pokemon.name} around` );
                            }, this);
                           
                            hb.cells[i].WildPokemon.forEach(function(wild) {
                                //console.log(util.inspect(wild, {showHidden: false, depth: null}));
                                let pokemon = a.pokemonlist[parseInt(wild.pokemon.PokemonId) - 1];
                                mapPokemon.push(pokemon);
                                console.log(`[+] ${wild.EncounterId}: There is a ${pokemon.name} wild` );
                            }, this);
                           
                        }

                        if (mapPokemon.length == 0) {
                            console.log('[+] There is no pokemon near you');
                        }

                        currentlocation++;
                        if(currentlocation >= locations.length)
                        {
                            currentlocation = 0;
                        }
                        a.SetLocation(locations[currentlocation],function(a,b){return;});       
                }); 
        }, configuration.timelapse);
    });
});

function sendEmail(pokemonName, locationName)
{
    console.log("Sending email");
    var transporter = nodemailer.createTransport(configuration.email.smpts);

    var mailOptions = {
        from: `"${configuration.email.fromName}" <${configuration.email.fromEmail}>`,
        to: 'jose_almada@hotmail.com',
        subject: `${pokemon.name} was Found!`,
        text: `${pokemonName} was found at ${locationName}`,
        html: `<b>${pokemonName}</b> was found at ${locationName}`
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });
}

Array.prototype.contains = function(k, callback) {
    var self = this;
    return (function check(i) {
        if (i >= self.length) {
            return callback(false);
        }

        if (self[i] === k) {
            return callback(true);
        }

        return process.nextTick(check.bind(null, i+1));
    }(0));
};