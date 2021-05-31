const Order = require('../models/order.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');

module.exports.index = async (req, res) => {
const orders = await Order.find({ userId: req.user._id });
  try {
    res.status(200).json(orders);
  } catch (err) {
    res.status(400).send(err);
  }
}

module.exports.removeAll = async (req, res) => {
  const orders = await Order.deleteMany({});
  try {
    res.status(200).json("Delete successfully!");
  } catch (err) {
    res.status(400).send(err);
  }
}

module.exports.updateStatus = async (req, res) => {
  try {
    const data = req.body;
    const result = await Order.findByIdAndUpdate(data._id, data, { new: true });
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send(err);
  }
}
