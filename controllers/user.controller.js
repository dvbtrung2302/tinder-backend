const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const multiparty = require('multiparty');

module.exports.index = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user);
}

module.exports.signup = async (req, res) => {
  const {
    username,
    password,
    confirmPassword
  } = req.body;
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
    password: hashPassword
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
      password
    } = req.body;
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
    const returnedUser = { ...user._doc };
    delete returnedUser.password;
    return res.json({
      status: 1,
      token,
      user: returnedUser
    })
  } catch (error) {
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
      area,
      gender
    } = data;
    const postData = {
      email,
      phone,
      area,
      gender
    }
    if (parseInt(gender) !== 1 && parseInt(gender) !== 0) {
      res.json({
        status: 0,
        message: "Giới tính không hợp lệ"
      })
      return;
    }
    const result = await User.findByIdAndUpdate(req.user._id, postData);
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
    res.json({
      status: 0,
      message: "Cập nhật tài khoản thất bại",
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
        const result = await User.findByIdAndUpdate(req.user._id, postData);
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
      const result = await User.findByIdAndUpdate(req.user._id, postData);
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