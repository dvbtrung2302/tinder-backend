const Admin = require('../models/admin.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');

module.exports.create = async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);
  
  const admin = new Admin({
    username: req.body.username,
    password: hashPassword
  })
  try {
    const saveAdmin = await admin.save();
    res.status(200).json(saveAdmin);
  } catch {
    res.status(400).send(err);
  }
}

module.exports.login = async (req, res) => {
  const admin = await Admin.findOne({ username: req.body.username });
  if (!admin) {
    return res.status(400).send('Username is not found.');
  }

  const token = jwt.sign({_id: admin._id}, process.env.TOKEN_SECRET);

  const validPassword = await bcrypt.compare(req.body.password, admin.password);
  if (!validPassword) return res.status(400).send('Invalid password');
  res.status(200).json({token: token});
}

module.exports.adminGet = async (rea, res) => {
  const orders = await Order.find();
  const users = await User.find();
  const products = await Product.find();
  const data = {
    orders,
    users, 
    products
  }
  res.json(data);
}

module.exports.updateProduct = async (req, res) => {
  try {
    const data = req.body;
    const result = await Product.findByIdAndUpdate(data._id, data, { new: true });
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send(err);
  }
}

module.exports.addProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
}

module.exports.deleteProduct = async (req, res) => {
  try {
    const data = req.body;
    const result = await Product.findByIdAndDelete(data._id);
    res.status(200).send("Delete sunccessfully");
  } catch (err) {
    res.status(400).send(err);
  }
}