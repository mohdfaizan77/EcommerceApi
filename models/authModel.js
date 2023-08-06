// models/authModel.js
const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
});

const Auth = mongoose.model('Auth', authSchema);

module.exports = Auth;
