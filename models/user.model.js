const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  phone: String,
  avatar: String,
  photos: Array,
  gender: Number,
  hobbies: Array,
  area: Number,
});

const User = mongoose.model('User', userSchema);

module.exports = User;