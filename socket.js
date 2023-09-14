// socket.js

const Connection = require("./models/connection");
const User = require("./models/user");

const initializeSocket = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");
    console.log("Socket is active", socket.id);

    socket.on("joinRoom", async ({ userA, roomId }) => {
      console.log("\x1b[32m", `${userA} joined room ${roomId}`);
      console.log("\x1b[0m", `Emd`);
      socket.join(roomId); // Join the specified room

      const connection = await Connection.findOne({ _id: roomId });

      if (connection) {
        connection.chatHistory.forEach(async (message) => {
          if (!message.isRead && message.receiverID === userA) {
            message.isRead = true;
            await connection.save();
            console.log("Message read 111:", message._id);
            io.to(roomId).emit("messageRead", { messageId: message._id });
          }
        });
      } else {
        console.log("Connection not found");
      }
    });

    socket.on("leaveRoom", ({ userA, roomId }) => {
      console.log("\x1b[31m", `${userA} left room ${roomId}`);
      console.log("\x1b[0m", `Emd`);
      socket.leave(roomId); // Leave the specified room
    });

    socket.on("messageRead", async ({ roomId, messageId }) => {
      console.log("Message read:", messageId);

      if (!roomId || !messageId) {
        return;
      }

      const connection = await Connection.findOne({ _id: roomId });
      const message = connection.chatHistory.id(messageId);
      if (message) {
        message.isRead = true;
        await connection.save();
      }

      io.to(roomId).emit("messageRead", { messageId });
    });

    socket.on("chatMessage", async (data) => {
      console.log("Message received:", data);

      const connection = await Connection.findOne({ _id: data.roomId });
      if (!connection.chatHistory) {
        connection.chatHistory = [];
      }

      connection.chatHistory.push({
        senderID: data.sender,
        receiverID: data.receiver,
        message: data.message,
        timestamp: Date.now(),
      });

      await connection.save();

      const message = connection.chatHistory[connection.chatHistory.length - 1];

      io.to(data.roomId).emit("message", message);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  return io;
};

module.exports = initializeSocket;
