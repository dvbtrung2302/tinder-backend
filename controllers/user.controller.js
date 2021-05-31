const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
      status: 1,
      message: "Username and Password must be more than 6 characters"
    });
  }
  if (usernameExist) {
    return res.json({
      status: 1,
      message: "Username already exists"
    });
  }
  if (password !== confirmPassword) {
    return res.json({
      status: 1,
      message: "Password and Confirm Password do not match"
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
      status: 0,
      message: "Registered successfully"
    });
  } catch {
    res.json({
      status: 1,
      message: "Unknow error"
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
        status: 1,
        message: "Username is not found"
      });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.json({
        status: 1,
        message: "Invalid password"
      });
    }
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET || "super_cool_secret");
    const returnedUser = { ...user._doc };
    delete returnedUser.password;
    return res.json({
      status: 0,
      token,
      user: returnedUser
    })
  } catch (error) {
    res.json({
      status: 1,
      message: "Unknow error"
    })
  }
}

module.exports.update = async (req, res) => {
  try {
    const data = req.body;
    const result = await User.findByIdAndUpdate(req.user._id, data, { new: true });
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send(err);
  }
}