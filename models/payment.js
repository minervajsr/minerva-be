const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: [true, "Please add a paymentId"],
    trim: true,
    maxlength: [50, "paymentId cannot be more than 50 characters"],
  },
  paymentType: {
    type: String,
    required: [true, "Please add a paymentType"],
  },
  paymentAmount: {
    type: Number,
    required: [true, "Please add a paymentAmount"],
  },
  paymentStatus: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED"],
    default: "PENDING",
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  paymentMode: {
    type: String,
  },
  paymentRemarks: {
    type: String,
    default: "",
  },
  paymentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
