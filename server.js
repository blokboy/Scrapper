var scrapper_artifacts = require('./build/contracts/Scrapper.json')
var contract = require('truffle-contract')
var Web3 = require('web3')
// Change these for deployment 
var provider = new Web3.providers.HttpProvider("http://localhost:8545");
var Scrapper = contract(scrapper_artifacts);
var PhotoModel = require('./photo.js');
Scrapper.setProvider(provider);

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/Scrapper");
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var express = require('express');

var app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.listen(3000, function() {
  console.log("Scrapper Server Listening On Port 3000");
});

app.get('/', function(req, res) {
  res.send("Hello, Smart Guy!");
});

app.get('/photos', function(req, res) {
  var query = {};
  if(req.query.category !== undefined) {
    query['category'] = {$eq: req.query.category};
  }
  PhotoModel.find(query, null, {sort: 'blockchainId'}, function(err, items) {
    console.log(items.length);
    res.send(items);
  });
});

setupPhotoEventListener();

function setupPhotoEventListener() {
  var photoEvent;
  Scrapper.deployed().then(function(i) {
    photoEvent = i.NewPhoto({fromBlock: 0, toBlock: 'latest'})
    photoEvent.watch(function(err, result) {
      if(err) {
        console.log(err)
        return;
      }
      console.log(result.args);
      savePhoto(result.args);
    });
  });
}

function savePhoto(photo) {
  PhotoModel.findOne({ 'blockchainId': photo._ID.toNumber() }, function(err, dbProduct){
    if(dbProduct != null) {
      return;
    }

    var p = new PhotoModel({address: photo._curator, blockchainId: photo._ID.toNumber(), likes: photo._likes.toNumber(),
                            name: photo._name, category: photo._category, ipfsImageHash: photo._imageLink, ipfsDescHash: photo._descLink,
                            flagged: photo._flagged
    });

    p.save(function(error) {
      if(error) {
        console.log(error);
      } else {
        PhotoModel.count({}, function(err, count) {
          console.log("Count is " + count);
        });
      }
    });
  })
}
