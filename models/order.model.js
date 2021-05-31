const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  email: String,
  address: String,
  city: String,
  district: String,
  phone: String,
  cart: Array,
  totalPrice: Number,
  payment: String,
  date: String,
  orderTime: String,
  status: Number
})

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;