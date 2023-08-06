const jwt = require("jsonwebtoken");
const parseToken = require("parse-access-token").default
const User = require('../models/userModel')
const dotenv = require('dotenv').config()
const config = process.env;

module.exports.verifyToken = async (req, res, next) => {
   const token =
     req.body.token || req.query.token || req.headers["x-access-token"] || req.headers.authorization.split("Bearer ")[1];
// const token = parseToken(req)

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const decoded = jwt.verify(token, "8fiazA5bmZquA5X4");
    req.user = await User.findById(decoded.userId).select('-passeword');
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};
