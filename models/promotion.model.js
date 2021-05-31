const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,
  value: Number,
  code: String,
});

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;