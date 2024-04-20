const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const Cashfree = require("cashfree-pg").Cashfree;
const User = require("../models/user");
const Payment = require("../models/payment");
const { default: axios } = require("axios");
// Set Cashfree credentials and environment

console.log("Cashfree", Cashfree);

Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET;
("");
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

exports.createOrder = BigPromise(async (req, res, next) => {
  console.log("createOrder");

  const { amount, currency, orderType, userId, orderId } = req.body;

  console.log(
    "customerId",
    req.user._id,
    req.user.name,
    req.user.email,
    req.user.phone || ""
  );

  try {
    const request = {
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: `${req.user._id}`,
        customer_name: `${req.user.name}`,
        customer_email: `${req.user.email}`,
        customer_phone: `${
          req.user.mobile.countryCode + req.user.mobile.phone || ""
        }`,
      },
      order_meta: {
        return_url: "http://localhost:5173/payment/{order_id}",
        // notify_url:
        //   "https://webhook.site/75ff5563-5804-4050-80d6-425e3cb3106b/cashfree-webhook/",
      },
      order_note: `Payment for ${orderType} by ${userId}`,
    };

    const response = await Cashfree.PGCreateOrder("2022-09-01", request);
    const orderData = response.data;

    // console.log("Order data:", orderData);

    // You can do further processing with orderData if needed

    const payment = await Payment.create({
      paymentId: orderData.order_id,
      paymentType: orderType,
      paymentAmount: amount,
      paymentUser: userId,
      paymentRemarks: orderData.order_note,
      paymentMode: orderData.payment_group,
    });

    console.log("Payment created:", payment);

    //Add payment to user

    const user = await User.findById(userId);

    if (!user) {
      return next(new CustomError("User not found", 404));
    }

    user.paymentHistory.push(payment._id);
    await user.save();

    res.status(200).json({ success: true, data: orderData });
  } catch (error) {
    console.error("Error setting up order request:", error);
    // You may want to customize the error response based on your requirements
    const errorMessage = error.response.data
      ? error.response.data.message
      : "Error creating order";
    next(new CustomError(errorMessage, 500));
  }
});

exports.verifyPayment = BigPromise(async (req, res, next) => {
  console.log("verifyPayment");

  const { orderId } = req.params;

  // console.log("orderId", orderId);

  try {
    const response = await Cashfree.PGFetchOrder("2022-09-01", orderId);
    const orderData = response.data;

    // console.log("Order data:", orderData);

    // You can do further processing with orderData if needed

    const user = await User.findById(orderData.customer_details.customer_id);

    if (!user) {
      return next(new CustomError("User not found", 404));
    }

    if (orderData.order_status === "PAID") {
      user.isPremiumActivated = true;
      console.log("orderData.order_note", orderData.order_note.split(" ")[2]);
      if (orderData.order_note.split(" ")[2] === "SUBSCRIPTION_MONTHLY") {
        let currentDate = new Date();
        if (user.premiumExpiry && new Date(user.premiumExpiry) > currentDate) {
          currentDate = new Date(user.premiumExpiry);
        }

        user.premiumExpiry = new Date(
          currentDate.setMonth(currentDate.getMonth() + 1)
        );

        await user.save();

        console.log("currentDate", currentDate);
        console.log("user.premiumExpiry", user.premiumExpiry);
      }

      //Update payment data

      const paymentDataFetch = await axios.get(
        `https://sandbox.cashfree.com/pg/orders/${orderId}/payments`,
        {
          headers: {
            "x-api-version": "2022-09-01",
            "X-Client-Id": process.env.CASHFREE_CLIENT_ID,
            "X-Client-Secret": process.env.CASHFREE_SECRET,
          },
        }
      );

      if (paymentDataFetch.data.status === "ERROR") {
        return next(new CustomError("Something is Wrong", 500));
      }

      const payment_data = await Payment.findOneAndUpdate(
        { paymentId: orderId },
        {
          paymentStatus: "SUCCESS",
          paymentDate: paymentDataFetch.payment_completion_time,
          paymentMode: paymentDataFetch.payment_group,
        },
        { new: true }
      );
      res.status(200).json({
        success: true,
        data: orderData,
        paymentData: payment_data,
        userData: user,
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    // You may want to customize the error response based on your requirements
    const errorMessage = error.response.data
      ? error.response.data.message
      : "Error verifying payment";
    next(new CustomError(errorMessage, 500));
  }
});

exports.getPayment = BigPromise(async (req, res, next) => {
  console.log("getPayment");

  const { paymentId } = req.params;

  try {
    const payment = await Payment.findOne({
      paymentId,
    });

    if (!payment) {
      return next(new CustomError("Payment not found", 404));
    }

    payment.populate("paymentUser");

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.error("Error getting payment:", error);
    next(new CustomError("Error getting payment", 500));
  }
});
