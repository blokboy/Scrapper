var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

var Schema = mongoose.Schema;
//Consider changing category to a number
var PhotoSchema = new Schema({
  address: String,
  blockchainId: Number,
  likes: Number,
  name: String,
  category: String,
  ipfsImageHash: String,
  ipfsDescHash: String,
  flagged: Boolean
});

var PhotoModel = mongoose.model('PhotoModel', PhotoSchema);


module.exports = PhotoModel;
