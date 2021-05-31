const Promotion = require('../models/promotion.model');

module.exports.index = async (req, res) => {
  try {
    const promotions = await Promotion.find();
    res.status(200).json(promotions);
  } catch (error) {
    res.status(400).json(error);
  }
}

module.exports.createPromotion = async (req, res) => {
  try {
    const data = req.body;
    const promotions = await Promotion.create(data);
    res.status(200).send("Created succesfully!"); 
  } catch (error) {
    res.status(400).send(error);
  }
}

module.exports.getPromotion = async (req, res) => {
  try {
    const id = req.query.id;
    const promotion = await Promotion.findById(id);
    res.status(200).json(promotion);
  } catch (error) {
    res.status(400).send(error);
  }
}

module.exports.applyPromotion = async (req, res) => {
  try {
    const { code, price } = req.body;
    const promotion = await Promotion.findOne({ code: code });
    if (!promotion) {
      res.status(200).json({
        status: 0,
        msg: "Mã giảm giá không hợp lệ",
      });
    } else {
      const priceAfterPromotion = ((price * promotion.value) / 100) < 0 ? 0 : Math.ceil(((price * promotion.value)) / 100);
      const resData = {
        status: 1,
        msg: "Áp dụng mã giảm gía thành công",
        priceAfterPromotion: priceAfterPromotion
      }
      res.status(200).json(resData);
    }
  } catch (error) {
    res.status(400).send(error);
  }
}

module.exports.updatePromotion = async (req, res) => {
  try {
    const data = req.body;
    const result = await Promotion.findByIdAndUpdate(data._id, data, { new: true });
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send(err);
  }
}


module.exports.deletePromotion = async (req, res) => {
  try {
    const data = req.body;
    const result = await Promotion.findByIdAndDelete(data._id);
    res.status(200).send("Delete sunccessfully");
  } catch (err) {
    res.status(400).send(err);
  }
}