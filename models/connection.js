const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  chatHistory: [
    {
      senderID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      receiverID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      message: String,
      timestamp: { type: Date, default: Date.now },
      isRead: { type: Boolean, default: false },
    },
  ],
});

connectionSchema.path("chatHistory").default([]);

module.exports = mongoose.model("Connection", connectionSchema);
