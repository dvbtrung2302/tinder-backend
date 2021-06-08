const jwt = require('jsonwebtoken');

module.exports.verifyToken = function(req, res, next) {
  const token = req.headers.authorization.split(' ')[1];
  if (!token) return res.json({
    status: 0,
    message: "Thiếu token"
  });

  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET || "super_cool_secret");
    req.user = verified;
    next();
  } catch(err) {
    return res.json({
      status: 0,
      message: "Thiếu token"
    });
  }
}