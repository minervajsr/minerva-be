// Cashfree payment routes

const express = require("express");
const router = express.Router();

const { isLoggedIn } = require("../middlewares/user");

const {
  createOrder,
  verifyPayment,
  getPayment,
} = require("../controllers/paymentController");

router.route("/createOrder").post(isLoggedIn, createOrder);
router.route("/verifyPayment/:orderId").get(isLoggedIn, verifyPayment);
router.route("/getPayment/:paymentId").get(isLoggedIn, getPayment);

// router.route("/callback/:orderId").post(paymentCallback);

module.exports = router;
