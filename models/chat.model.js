const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  message: String,
  created_at: Date,
  user_post: Object,
  room_id: String,
  is_seen: Boolean
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;