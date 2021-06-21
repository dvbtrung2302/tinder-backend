const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const multiparty = require('multiparty');

module.exports.index = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.json({
        status: 0,
        message: "Không tìm thấy người dùng"
      });
    }
    const returnedUser = { ...user._doc };
    delete returnedUser.password;
    res.json({
      status: 1,
      message: "Thành công",
      data: returnedUser
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
    confirmPassword
  } = req.body;
  if (!username || !password || !full_name || !confirmPassword) {
    return res.json({
      status: 0,
      message: "Thiếu thông tin"
    });
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
    const users = await User.find({});
    
    const canMatchingList = users
    .map(item => {
      const tempItem = { ...item._doc }
      delete tempItem.password;
      return tempItem
    })
    .filter(item => item._id.toString() !== user._id.toString());
    let filtedCanMatchingList = canMatchingList;
    if (user.matching_list && user.matching_list.length) {
      filtedCanMatchingList = canMatchingList.filter(({_id}) => !user.matching_list.find((element) => element.toString() === _id.toString()));
    }
    
    const returnedUser = { ...user._doc };
    delete returnedUser.password;
    return res.json({
      status: 1,
      token,
      user: {
        ...returnedUser,
        can_matching_list: filtedCanMatchingList
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
      address,
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
    const postData = {
      email: email || user.email,
      phone: phone || user.phone,
      full_name: full_name || user.full_name,
      area: (area !== undefined && area !== null) ? parseInt(area) : user.area,
      gender: (gender !== undefined && gender !== null) ? parseInt(gender) : user.gender,
      address: address || user.address,
      bio: bio || user.bio
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
    console.log(err);
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