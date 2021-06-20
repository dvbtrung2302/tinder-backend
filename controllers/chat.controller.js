const Chat = require('../models/chat.model');

module.exports.index = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const roomId = req.query.roomId;
    if (!roomId) {
      return res.json({
        status: 0,
        message: "RoomId không hợp lệ"
      });
    } 
    
    const messages = await Chat.find({ room_id: roomId })
   
    return res.json({
      status: 1,
      message: "Thành công",
      data: messages
    });
  } catch (error) {
    return res.json({
      status: 0,
      message: "Không tìm thấy dữ liệu tin nhắn"
    });
  }
}
module.exports.deleteAll = async (req, res) => {
  try {
    await Chat.deleteMany({});
    return res.json({
      status: 1,
      message: "Thành công"
    });
  } catch (error) {
    return res.json({
      status: 0,
      message: "Lỗi"
    });
  }
}