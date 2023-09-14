const Connection = require("./models/connection");
const User = require("./models/user");
const app = require("./app");
require("dotenv").config();
const connectWithDb = require("./config/db");
const cloudinary = require("cloudinary").v2;
const cron = require("node-cron");
const fs = require("fs");
const { sendEmailNotification, transporter } = require("./utils/email");
const initializeSocket = require("./socket");

// Connect with the database
connectWithDb();

// Schedule the task to run periodically
cron.schedule("*/15 * * * *", () => {
  const findUnreadMessages = async () => {
    let unreadMessages = [];
    try {
      const currentTime = new Date();
      const thresholdTime = new Date(currentTime.getTime() - 15 * 60 * 1000); // 30 minutes ago

      // Find all unread messages sent in the last 30 minutes
      unreadMessages = await Connection.aggregate([
        {
          $unwind: "$chatHistory",
        },
        {
          $match: {
            "chatHistory.isRead": false, // Only unread messages
            "chatHistory.timestamp": { $gte: thresholdTime }, // Sent within the last 30 minutes
          },
        },
        {
          $project: {
            _id: 0, // Exclude the default _id field
            senderID: "$chatHistory.senderID",
            receiverID: "$chatHistory.receiverID",
            message: "$chatHistory.message",
            timestamp: "$chatHistory.timestamp",
          },
        },
      ]);

      if (unreadMessages.length > 0) {
        // Create arrays to store sender and receiver IDs
        const senderIds = unreadMessages.map((message) => message.senderID);
        const receiverIds = unreadMessages.map((message) => message.receiverID);

        // Fetch sender and receiver details
        const senders = await User.find(
          { _id: { $in: senderIds } },
          "name email"
        );
        const receivers = await User.find(
          { _id: { $in: receiverIds } },
          "name email"
        );

        // Create a mapping of user IDs to user details for efficient lookup
        const senderMap = senders.reduce((map, sender) => {
          map[sender._id.toString()] = sender;
          return map;
        }, {});

        const receiverMap = receivers.reduce((map, receiver) => {
          map[receiver._id.toString()] = receiver;
          return map;
        }, {});

        // Combine the unread messages with sender and receiver details
        const unreadMessagesWithUserInfo = unreadMessages.map((message) => ({
          sender: senderMap[message.senderID.toString()],
          receiver: receiverMap[message.receiverID.toString()],
          message: message.message,
          timestamp: message.timestamp,
        }));

        const uniqueReceiverEmails = new Set();

        // Iterate through the unread messages and add receiver email IDs to the Set
        unreadMessagesWithUserInfo.forEach((message) => {
          const receiverEmail = message.receiver.email;
          uniqueReceiverEmails.add(receiverEmail);
        });

        const uniqueReceiverEmailsArray = [...uniqueReceiverEmails];

        // Send email notification to each receiver
        uniqueReceiverEmailsArray.forEach((email) => {
          const messagesForThisReceiver = unreadMessagesWithUserInfo.filter(
            (message) => message.receiver.email === email
          );

          const senderNames = messagesForThisReceiver.map(
            (message) => message.sender.name
          );
          if (
            messagesForThisReceiver.length > 0 &&
            email &&
            senderNames.length > 0
          ) {
            sendEmailNotification(email, senderNames, messagesForThisReceiver);
          }
        });
      }
    } catch (error) {
      console.error("Error finding unread messages:", error);
      return [];
    }
  };

  findUnreadMessages();
});

// Cloudinary Configuration
cloudinary.config({
  cloud_name: `${process.env.CLOUDINARY_NAME}`,
  api_key: `${process.env.CLOUDINARY_API_KEY}`,
  api_secret: `${process.env.CLOUDINARY_API_SECRET}`,
});

const server = require("http").createServer(app);
const io = initializeSocket(server);

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
