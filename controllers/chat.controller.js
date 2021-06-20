const Chat = require('../models/chat.model');

module.exports.index = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const targetUserId = req.query.userId;
    if (!targetUserId) {
      return res.json({
        status: 0,
        message: "UserId không hợp lệ"
      });
    } 
    const unique = [userId.toString(), targetUserId.toString()].sort((a, b) => (a < b ? -1 : 1));
    const roomId = `${unique[0]}-${unique[1]}`;
    
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