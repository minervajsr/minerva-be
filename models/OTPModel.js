const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please add an email"],
    trim: true,
  },
  otp: {
    type: String,
    required: [true, "Please add an OTP"],
    trim: true,
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("OTPModel", OTPSchema);
