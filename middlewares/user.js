const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const jwt = require("jsonwebtoken");

exports.isLoggedIn = BigPromise(async (req, res, next) => {
  try {
    // console.log("I am in isLoggedIn middleware");
    // console.log("req.headers", req.headers);
    const token = req.headers.authorization.split(" ")[1];
    console.log("auth_token", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded", decoded);

    req.user = await User.findById(decoded.id);

    next();
  } catch (error) {
    console.log("error", error.message);
    return next(new CustomError("Please login to get access", 401));
  }
});
