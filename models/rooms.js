const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
  name:String,
  password:String,
  date: {type:Date,default:Date.now},
  socket_Room: String,
  users: [{type:String}]
});

module.exports = mongoose.model('Rooms',roomSchema);
