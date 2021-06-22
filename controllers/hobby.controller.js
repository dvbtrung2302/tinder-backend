
const Hobby = require('../models/hobby.model');

module.exports.index = async (req, res) => {
  try {
    const hobbies = await Hobby.find({});
    return res.json({
      status: 1,
      message: "Thành công",
      data: hobbies
    }) 
  } catch (error) {
    return res.json({
      status: 0,
      message: "Thất bại"
    })
  }
}

module.exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const hobby = new Hobby({ name });
    hobby.save();
    return res.json({
      status: 1,
      message: "Tạo sở thích thành công"
    })
  } catch (error) {
    return res.json({
      status: 0,
      message: "Tạo sở thích không thành công"
    })
  }
}
