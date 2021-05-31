const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: String,
  author: String,
  description: String,
  price: Number,
  image: String,
  category: String,
  slug: String
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
