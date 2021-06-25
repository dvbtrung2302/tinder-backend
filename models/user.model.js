const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  full_name: String,
  phone: String,
  avatar: String,
  photos: Array,
  gender: Number,
  hobbies: Array,
  area: Number,
  bio: String,
  address: String,
  coordinates: Object,
  matching_list: Array,
  matched_list: Array,
});

const User = mongoose.model('User', userSchema);

module.exports = User;