const Stripe = require('stripe');
const moment = require('moment');
const Order = require('../models/order.model');

const stripe = new Stripe(process.env.STRIPE_SECRET);

module.exports.index = async (req, res) => {
  const order = await Order.findById(req.query.id);
  res.json(order);
}

module.exports.postCheckout = async (req, res) => {
  const { id, order, amount } = req.body;
  if (!id) {
    const date = moment().format('LL');
    const orderTime = moment().format('LLL');
    const newOrder = new Order({
      userId: order.id,
      userName: order.name,
      email: order.email,
      address: order.address,
      city: order.city,
      district: order.district,
      phone: order.phone,
      cart: order.cartItems,
      payment: order.payment,
      totalPrice: order.totalPrice,
      date: date,
      orderTime: orderTime,
      status: 1
    })
  
    try {
      const savedOrder = await newOrder.save();
      res.status(200).json({order: savedOrder});
    } catch(err) {
      res.status(400).send(err);
    }
  } else {
    try {
      const date = moment().format('LL');
      const orderTime = moment().format('LLL');
      const payment = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'USD',
        payment_method: id,
        confirm: true
      })
      const newOrder = new Order({
        userId: order.id,
        userName: order.name,
        email: order.email,
        address: order.address,
        city: order.city,
        district: order.district,
        phone: order.phone,
        cart: order.cartItems,
        payment: order.payment,
        totalPrice: order.totalPrice,
        date: date,
        orderTime: orderTime,
        status: 1
      })
      const savedOrder = await newOrder.save();
      res.status(200).json({order: savedOrder});
    } catch(error) {
      res.status(500).send(error.message);
    }
  }
}