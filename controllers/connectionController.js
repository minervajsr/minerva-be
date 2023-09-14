const User = require("../models/user");
const Job = require("../models/jobs");
const Connection = require("../models/connection");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");

exports.getConnectionsByUserId = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({
    path: "userConnections",
    populate: {
      path: "participants",
      select: "name email",
    },
  });

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Create a new array of connections with partnerDetails added
  const connectionsWithPartnerDetails = user.userConnections.map(
    (connection) => {
      const partnerDetails = connection.participants.find(
        (participant) => participant._id.toString() !== user._id.toString()
      );

      //Add lastMessageDetails to the connection object
      const lastMessageDetails =
        connection.chatHistory[connection.chatHistory.length - 1];

      // console.log("lastMessageDetails", lastMessageDetails);

      return {
        ...connection.toObject(), // Convert Mongoose document to plain object
        partnerDetails, // Add partnerDetails to the connection object
        lastMessageDetails,
      };
    }
  );

  // Now, each connection in connectionsWithPartnerDetails should have a partnerDetails property
  // console.log("Connection Data", connectionsWithPartnerDetails);
  res.status(200).json({
    status: "success",
    message: "User connections fetched successfully",
    data: connectionsWithPartnerDetails,
  });
});

exports.getConnection = BigPromise(async (req, res, next) => {
  const userA = req.user._id;
  const userB = req.params.userBid;

  //Check if any connection exists between userA and userB

  const existingConnection = await Connection.findOne({
    participants: {
      $all: [userA, userB],
    },
  });

  // console.log("existingConnection", existingConnection);

  if (!existingConnection) {
    // console.log("No connection found");
    //No connection found for userA or userB so create a new connection
    console.log("Connection Does not exist");

    const connection = new Connection({
      participants: [userA, userB],
      chatHistory: [],
    });

    await connection.save();

    //Add the connection to userA and userB

    const userAConnection = await User.findById(userA);
    const userBConnection = await User.findById(userB);

    userAConnection.userConnections.push(connection._id);
    userBConnection.userConnections.push(connection._id);

    await userAConnection.save();
    await userBConnection.save();
    console.log("Connection CREATED", connection);

    return res.status(201).json({
      status: "success",
      data: connection,
    });
  }

  console.log("Connection found");

  return res.status(200).json({
    status: "success",
    data: existingConnection,
  });
});

exports.getAllMessagesByConnectionId = BigPromise(async (req, res, next) => {
  const existingConnection = await Connection.findById(req.params.connectionId);
  if (existingConnection) {
    let userB = existingConnection.participants
      .find((participant) => participant.toString() !== req.user._id.toString())
      .toString();

    console.log("userB", userB);

    let userBDetails = await User.findById(userB).select("name email");

    return res.status(200).json({
      status: "success",
      data: existingConnection.chatHistory,
      userBDetails,
    });
  }
  return res.status(404).json({
    status: "failure",
    message: "Connection not found",
  });
});

exports.getAllMessagesByUserId = BigPromise(async (req, res, next) => {});
