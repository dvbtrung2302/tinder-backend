const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const multiparty = require('multiparty');
const Chat = require('../models/chat.model');
const Hobby = require('../models/hobby.model');
const calcCrow = require('../utils/functions');

module.exports.index = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.json({
        status: 0,
        message: "Không tìm thấy người dùng"
      });
    }
    const returnedMatchingList = await Promise.all([...user.matching_list].map(async (item) => {
      const unique = [user._id.toString(), item._id.toString()].sort((a, b) => (a < b ? -1 : 1));
      const roomId = `${unique[0]}-${unique[1]}`;
      const message = await Chat.findOne({room_id: roomId}, {}, {sort: { 'created_at' : -1 }});

      if (message) {
        return {
          ...item,
          had_message: true,
          message
        }
      } else {
        return {
          ...item,
          had_message: false,
        }
      }
    }))
    const returnedUser = { ...user._doc };
    delete returnedUser.password;
    res.json({
      status: 1,
      message: "Thành công",
      data: {
        ...returnedUser,
        matching_list: returnedMatchingList
      }
    });
  } catch (error) {
    return res.json({
      status: 0,
      message: "Không tìm thấy người dùng"
    });
  }
}

module.exports.signup = async (req, res) => {
  const {
    username,
    password,
    full_name,
    address,
    confirmPassword,
    lat,
    lng,
    gender
  } = req.body;
  if (
    !username || 
    !password || 
    !full_name || 
    !confirmPassword || 
    !address || 
    !lat ||
    !lng ||
    gender === null
  ) {
    return res.json({
      status: 0,
      message: "Thiếu thông tin"
    });
  }
  if (gender !== null && gender !== undefined && parseInt(gender) !== 1 && parseInt(gender)!== 0) {
    res.json({
      status: 0,
      message: "Giới tính không hợp lệ"
    })
    return;
  }
  const usernameExist = await User.findOne({ username, username });
  if (username.length < 6 || password.length < 6) {
    return res.json({
      status: 0,
      message: "Tài Khoản và Mật Khẩu phải có ít nhất 6 ký tự"
    });
  }
  if (usernameExist) {
    return res.json({
      status: 0,
      message: "Tài khoản đã có người đăng ký"
    });
  }
  if (password !== confirmPassword) {
    return res.json({
      status: 0,
      message: "Mật Khẩu và Xác Nhận Mật Khẩu không trùng khớp"
    })
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  const user = new User({
    username,
    full_name,
    address,
    area: 100,
    gender,
    coordinates: {
      lat,
      lng,
    },
    password: hashPassword,
  })

  try {
    await user.save();
    res.json({
      status: 1,
      message: "Đăng ký thành công"
    });
  } catch {
    res.json({
      status: 0,
      message: "Lỗi không xác định"
    });
  }
}

module.exports.login = async (req, res) => {
  try {
    const {
      username, 
      password,
      address,
      lat,
      lng
    } = req.body;
    if (
      !username || 
      !password || 
      !address ||
      !lat ||
      !lng
    ) {
      return res.json({
        status: 0,
        message: "Thiếu thông tin"
      });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.json({
        status: 0,
        message: "Không tìm thấy tài khoản"
      });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.json({
        status: 0,
        message: "Mật khẩu không chính xác"
      });
    }
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET || "super_cool_secret", {});
    const postData = {
      address,
      coordinates: {
        lat,
        lng
      }
    }
    await User.findByIdAndUpdate(user._id, postData, {new: true});

    const returnedMatchingList = await Promise.all([...user.matching_list].map(async (item) => {
      const unique = [user._id.toString(), item._id.toString()].sort((a, b) => (a < b ? -1 : 1));
      const roomId = `${unique[0]}-${unique[1]}`;
      const message = await Chat.findOne({room_id: roomId}, {}, {sort: { 'created_at' : -1 }});

      if (message) {
        return {
          ...item,
          had_message: true,
          message
        }
      } else {
        return {
          ...item,
          had_message: false
        }
      }
    }))
    const returnedUser = { ...user._doc };
    delete returnedUser.password;

    return res.json({
      status: 1,
      token,
      user: {
        ...returnedUser,
        matching_list: returnedMatchingList
      },
    })
  } catch (error) {
    console.log(error);
    res.json({
      status: 0,
      message: "Lỗi không xác định"
    })
  }
}

module.exports.update = async (req, res) => {
  try {
    const data = req.body;
    const {
      email,
      phone,
      full_name,
      area,
      gender,
      hobbies,
      bio
    } = data;
    if (gender !== null && gender !== undefined && parseInt(gender) !== 1 && parseInt(gender)!== 0) {
      res.json({
        status: 0,
        message: "Giới tính không hợp lệ"
      })
      return;
    }
    const user = await User.findById(req.user._id);
    const hobbiesList = await Hobby.find({});
    let returnedHobbies = []
    if (hobbies && hobbies.length) {
      returnedHobbies = hobbiesList.filter(({_id}) => hobbies.find((element) => (element && element.toString()) === _id.toString()))
    }
    const postData = {
      email: email || user.email,
      phone: phone || user.phone,
      full_name: full_name || user.full_name,
      area: (area !== undefined && area !== null) ? parseInt(area) : user.area,
      gender: (gender !== undefined && gender !== null) ? parseInt(gender) : user.gender,
      bio: bio || user.bio,
      hobbies: returnedHobbies || user.hobbies
    }
    const result = await User.findByIdAndUpdate(req.user._id, postData, {new: true});
    const returnedUser = { ...result._doc };
    delete returnedUser.password;
    res.json({
      status: 1,
      message: "Cập nhật tài khoản thành công",
      data: {
        ...returnedUser,
        ...postData
      }
    })
  } catch (err) {
    console.log(err);
    res.json({
      status: 0,
      message: "Cập nhật tài khoản thất bại",
    })
  }
}

module.exports.updateCoordinates = async (req, res) => {
  try {
    const {
      lat,
      lng
    } = req.body;
   
    if (!lat || ! lng) {
      return res.json({
        status: 0,
        message: "Thiếu thông tin"
      })
    }
    const postData = {
      coordinates: {
        lat,
        lng
      }
    }
    const result = await User.findByIdAndUpdate(req.user._id, postData, {new: true});
    const returnedUser = { ...result._doc };
    delete returnedUser.password;
    res.json({
      status: 1,
      message: "Cập nhật tọa độ thành công",
      data: {
        ...returnedUser,
        ...postData
      }
    })
  } catch (err) {
    res.json({
      status: 0,
      message: "Cập nhật tọa độ thất bại",
    })
  }
}

module.exports.uploadAvatar = async (req, res) => {
  try {
    const form = new multiparty.Form();
    form.parse(req, async function(err, fields, files) {
      const { avatar } = files; 
      const uploadResponse = await cloudinary.uploader.upload(avatar[0].path, {});
      if (uploadResponse.url) {
        const postData = {
          avatar: uploadResponse.url
        }
        const result = await User.findByIdAndUpdate(req.user._id, postData, {new: true});
        const returnedUser = { ...result._doc };
        delete returnedUser.password;
        res.json({
          status: 1,
          message: "Cập nhật ảnh đại diện thành công",
          data: {
            ...returnedUser,
            ...postData
          }
        })
      } else {
        res.json({
          status: 0,
          message: "Cập nhật ảnh đại diện thất bại",
        })
      }
    });
  } catch (err) {
    res.json({
      status: 0,
      message: "Cập nhật ảnh đại diện thất bại",
    })
  }
}

module.exports.uploadPhoto = async (req, res) => {
  try {
    const form = new multiparty.Form();
    form.parse(req, async function(err, fields, files) {
      const { photos } = files; 
      const user = await User.findById(req.user._id);
      const urls = [...user.photos];
      for (const photo of photos) {
        const uploadResponse = await cloudinary.uploader.upload(photo.path, {});
        urls.push(uploadResponse.url)
      }

      if (!urls.length) {
        res.json({
          status: 0,
          message: "Tải ảnh thất bại",
        })
        return;
      } 
      const postData = {
        photos: urls
      }
      const result = await User.findByIdAndUpdate(req.user._id, postData, {new: true});
      const returnedUser = { ...result._doc };
      delete returnedUser.password;
      delete returnedUser.photos;
      res.json({
        status: 1,
        message: "Tải ảnh thành công",
        data: {
          ...returnedUser,
          ...postData
        }
      })
    });
  } catch (err) {
    res.json({
      status: 0,
      message: "Tải ảnh thất bại",
    })
  }
}

module.exports.deletePhoto = async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo) {
      res.json({
        status: 0,
        message: "Thiếu dữ liệu",
      })
      return;
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      res.json({
        status: 0,
        message: "Không tìm thấy người dùng",
      })
      return;
    }
    const urls = [...user.photos];
    const index = urls.findIndex(url => url === photo);
    if (index !== -1) {
      urls.splice(index, 1);
      const postData = {
        photos: urls
      }
      const result = await User.findByIdAndUpdate(req.user._id, postData, {new: true});
      const returnedUser = { ...result._doc };
      delete returnedUser.password;
      return res.json({
        status: 1,
        message: "Xóa ảnh thành công",
        data: returnedUser
      })
    } 
    return res.json({
      status: 0,
      message: "Không tìm thấy ảnh",
    })
  } catch (error) {
    res.json({
      status: 0,
      message: "Xóa ảnh thất bại",
    })
  }
}

module.exports.getCanMatchingList = async (req, res) => {
  try {
    const users = await User.find({});
    const user = await User.findById(req.user._id);
    const canMatchingList = users
      .map(item => {
        const tempItem = { ...item._doc }
        delete tempItem.password;
        return {
          ...tempItem,
          km: calcCrow(
            item.coordinates.lat, 
            item.coordinates.lng, 
            user.coordinates.lat,
            user.coordinates.lng,
          )
        }
      })
      .filter(item => (
        item.gender !== user.gender && 
        item._id.toString() !== user._id.toString() &&
        calcCrow(
          item.coordinates.lat, 
          item.coordinates.lng, 
          user.coordinates.lat,
          user.coordinates.lng,
        ) <= parseInt(user.area)
      ));
    let returnedMatchingList = canMatchingList;
    if (user.matched_list && user.matched_list.length) {
      returnedMatchingList = canMatchingList.filter(({_id}) => !user.matched_list.find((element) => element._id.toString() === _id.toString()));
    }
    
    const notMatchHobbies = [];
    if (canMatchingList && canMatchingList.length) {
      for (let canMatchingUser of canMatchingList) {
        if (canMatchingUser.hobbies && canMatchingUser.hobbies.length) {
          for (let hobby of canMatchingUser.hobbies) {
            const index = user.hobbies.findIndex(item => item._id.toString() === hobby._id.toString())
            if (index !== -1) {
              returnedMatchingList.push(canMatchingUser);
            } else {
              notMatchHobbies.push(canMatchingUser);
            }
          }
        }
      }
    }

    return res.json({
      status: 1,
      data: [
        ...returnedMatchingList,
        ...notMatchHobbies
      ]
    })
  } catch (error) {
    res.json({
      status: 0,
      message: "Lỗi không xác định"
    })
  }
}

module.exports.changePassword = async (req, res) => {
  try {
    const {
      old_password,
      new_password,
      confirm_password
    } = req.body;
    if (!old_password || !new_password || !confirm_password) {
      return res.json({
        status: 0,
        message: "Thiếu thông tin"
      })
    } 
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.json({
        status: 0,
        message: "Không tìm thấy tài khoản"
      });
    }
    const validPassword = await bcrypt.compare(old_password, user.password);
    if (!validPassword) {
      return res.json({
        status: 0,
        message: "Mật khẩu cũ không chính xác"
      });
    }
    if (new_password !== confirm_password) {
      return res.json({
        status: 0,
        message: "Mật Khẩu Mới và Xác Nhận Mật Khẩu Mới không trùng khớp"
      })
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(new_password, salt);
    const postData = {
      password: hashPassword
    }
    await User.findByIdAndUpdate(req.user._id, postData, {new: true})
    return res.json({
      status: 1,
      message: "Đổi mật khẩu thành công"
    })
  } catch (error) {
    res.json({
      status: 0,
      message: "Đổi mật khẩu thất bại"
    })
  }
}