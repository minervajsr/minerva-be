const User = require("../models/user");
const Job = require("../models/jobs");
const Company = require("../models/company");
const OTPModel = require("../models/OTPModel");
const Payment = require("../models/payment");

const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const cloudinary = require("cloudinary");
const fs = require("fs");
const axios = require("axios");
const {
  sendPasswordResetEmail,
  sendEmailOTPForVerification,
} = require("../utils/email");

exports.signup = BigPromise(async (req, res, next) => {
  const { name, email, password, userType, userSkills } = req.body;

  if (!name || !email || !password) {
    throw new CustomError("Please provide all the required fields", 400);
  }

  const user = await User.create({
    name,
    email,
    password,
    userType,
    userSkills,
  });

  cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError("Please provide all the required fields", 400);
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    res.status(404).send({
      status: "fail",
      message: "Please check your email and password",
    });

    throw new CustomError("Invalid credentials", 401);
  }

  const isPasswordCorrect = await user.isValidatedPassword(password);

  if (!isPasswordCorrect) {
    res.status(404).send({
      status: "fail",
      message: "Please check your email and password",
    });

    throw new CustomError("Invalid credentials", 401);
  }

  cookieToken(user, res);
});

//SOCIAL LOGINS
exports.googleLogin = BigPromise(async (req, res, next) => {
  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    "postmessage"
  );
  const { tokens } = await oAuth2Client.getToken(req.body.code); // exchange code for tokens
  // console.log(tokens);

  const idToken = tokens.id_token;
  const decodedToken = jwt.decode(idToken, { complete: true });
  // 'decodedToken' now contains header and payload
  const payload = decodedToken.payload;

  //Check if user exists
  const user = await User.findOne({ email: payload.email });

  if (!user) {
    //Create new user
    const newUser = await User.create({
      name: payload.name,
      email: payload.email,
      password: payload["sub"],
      userType: "USER",
    });

    cookieToken(newUser, res);
  }

  cookieToken(user, res);
});

exports.linkedinLogin = BigPromise(async (req, res, next) => {
  const { code } = req.body;

  try {
    const response = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        params: {
          grant_type: "authorization_code",
          code: code,
          client_id: "77y22iyhuynakm",
          client_secret: "pdRAnwBhH724peSL",
          redirect_uri: `http://127.0.0.1:5173/linkedin`,
        },
      }
    );
    const accessToken = response.data.access_token;

    const profileResponse = await axios.get(
      "https://api.linkedin.com/v2/userinfo	",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userDetails = profileResponse.data;

    //Check if user exists
    const user = await User.findOne({ email: userDetails.email });

    if (!user) {
      //Create new user
      const newUser = await User.create({
        name: userDetails.name,
        email: userDetails.email,
        password: userDetails["sub"],
        userType: "USER",
      });

      cookieToken(newUser, res);
    }

    cookieToken(user, res);
  } catch (error) {
    // Handle any errors that may occur during the request
    console.error(error);

    return next(new CustomError("Error logging in with LinkedIn", 500));
  }
});

exports.logout = BigPromise(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404).json({
      status: "fail",
      message: "User with this email does not exist",
    });

    return next(new CustomError("User with this email does not exist", 404));
  }

  const forgotToken = user.getForgotPasswordToken();
  await user.save({ validateBeforeSave: false });

  const myUrl = `${req.headers.origin}/password-reset/${forgotToken}`;

  console.log("resetLink", myUrl);
  try {
    sendPasswordResetEmail(user.email, myUrl);

    res.status(200).json({
      status: "success",
      message: "Password reset link sent to your email",
      resetURL: myUrl,
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new CustomError(error.message, 500));
  }
});

exports.passwordReset = BigPromise(async (req, res, next) => {
  const token = req.params.token;

  console.log("token", token);

  const encryptedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  console.log("encryptedToken", encryptedToken);

  const user = await User.findOne({
    forgotPasswordToken: encryptedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });
  console.log("user", user);

  if (!user) {
    res.status(400).json({
      status: "fail",
      message: "Token is invalid or expired",
    });
    return next(new CustomError("Invalid token or Expired", 400));
  }

  if (!req.body.password) {
    return next(new CustomError("Password does not match", 400));
  }
  user.password = req.body.password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  await user.save();

  cookieToken(user, res);
  console.log("user", user);
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
  console.log("Get logged in user details");
  let user = await User.findById(req.user._id);
  // console.log("user", user, req.user._id);

  // Find jobs applied by the user

  if (!user) {
    return next(new CustomError("No user found", 404));
  }

  let jobsApplied = await Job.find({
    "jobApplications.candidateId": req.user._id,
  });

  const jobsApplications = await Promise.all(
    jobsApplied.map(async (job) => {
      const jobCompany = await Company.findById(job.jobCompany).select(
        "companyName"
      );
      const jobApplication = job.jobApplications.filter(
        (app) => app.candidateId.toString() == req.user._id
      )[0];

      return {
        jobId: job._id,
        jobTitle: job.jobTitle,
        jobLocation: job.jobLocation,
        jobAppliedOn: jobApplication.jobAppliedOn,
        jobCompany: jobCompany,
        jobApplicationStatus: jobApplication.candidateStatus,
      };
    })
  );

  // console.log("data", jobsApplications);

  const paymentHistoryData = await Promise.all(
    user.paymentHistory.map((payment) => {
      console.log("payment", payment._id);
      return Payment.findById(payment._id);
    })
  );

  console.log("paymentHistoryData", paymentHistoryData);

  res.status(200).json({
    status: true,
    data: {
      ...user._doc,
      jobApplications: jobsApplications,
      paymentHistoryData: paymentHistoryData,
    },
  });
});

exports.getLoggedInUserResume = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  console.log("user", user, req.user._id);

  if (!user) {
    return next(new CustomError("No user found", 404));
  }

  const resume = user.userResume;

  res.status(200).json({
    status: true,
    data: resume,
  });
});

exports.changePassword = BigPromise(async (req, res, next) => {
  const userId = req.body.userId;
  const user = await User.findById(userId).select("+password");

  const isCorrectOldPassword = await user.isValidatedPassword(
    req.body.currentPassword
  );

  console.log("isValidatedPassword", isCorrectOldPassword);

  if (!isCorrectOldPassword) {
    return next(new CustomError("Old password is incorrect", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
  console.log("Update user details");
  const newData = {
    name: req.body.name,
    email: req.body.email,
    userType: req.body.userType,
    dob: req.body.dob,
    mobile: {
      countryCode: req.body?.mobile?.countryCode,
      phone: req.body?.mobile?.phone,
    },
    userSkills: req.body.userSkills,
    userResume: req.body.userResume,
  };

  console.log("newData", newData);

  try {
    const user = await User.findByIdAndUpdate(req.user._id, newData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      error: "Error updating user",
    });
  }
});

exports.uploadResume = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new CustomError("User not found", 404));
  }
  console.log("req.file", req.files);
  if (!req.files.resume) {
    return next(new CustomError("Please upload a file", 400));
  }

  // Get the temp file path

  const tempFilePath = req.files.resume.tempFilePath + req.files.resume.name;

  req.files.resume.mv(tempFilePath, async (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    console.log("tempFilePath", tempFilePath);

    const result = await cloudinary.v2.uploader.upload(
      tempFilePath,
      {
        resource_type: "raw",
        folder: "resumes",
      },
      async (error, result) => {
        console.log("result", result);
        if (error) {
          return next(new CustomError("Error uploading file", 500));
        }
        user.userResume = {
          id: result.public_id,
          secure_url: result.secure_url,
          fileName: req.files.resume.name,
          fileSize: req.files.resume.size,
        };
        await user.save();
      }
    );

    fs.unlinkSync(tempFilePath);
    res.status(200).json({
      success: true,
      message:
        "File uploaded and deleted from the server after successful cloud upload.",
      data: {
        id: result.public_id,
        secure_url: result.secure_url,
        fileName: req.files.resume.name,
        fileSize: req.files.resume.size,
      },
    });
  });
});

exports.emailVerification = BigPromise(async (req, res, next) => {
  const { email } = req.body;

  //Check if email already exists

  const isEmailAlreadyExists = await User.findOne({ email });

  if (isEmailAlreadyExists) {
    res.status(400).json({
      status: "fail",
      message: "This Email Already Exists",
    });
    return next(new CustomError("Email already exists", 400));
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  function isValidEmail(email) {
    return emailRegex.test(email);
  }

  if (!isValidEmail(email)) {
    return next(new CustomError("Please provide a valid email", 400));
  }

  sendEmailOTPForVerification(email);

  res.status(200).json({
    status: "success",
    message: "Email sent successfully",
  });
});

exports.verifyEmailOTP = BigPromise(async (req, res, next) => {
  const { email, otp } = req.body;

  // Compare the provided OTP with the stored OTP (hashed)
  const hashedOTP = crypto
    .createHmac("sha256", process.env.EMAIL_SECRET)
    .update(otp)
    .digest("hex");

  console.log("hashedOTP", hashedOTP);

  const otpDoc = await OTPModel.findOne({ email, otp: hashedOTP });

  if (!otpDoc) {
    res.status(400).json({ message: "OTP not found for this email." });
    return;
  }
  console.log("otpDoc.otp", otpDoc.otp);
  if (otpDoc.otp === hashedOTP) {
    // OTP is valid, you can delete the OTP document from the database
    console.log(
      "OTP is valid, you can delete the OTP document from the database"
    );
    await OTPModel.deleteOne({ email, otp });

    // Update the user's emailVerified field to true

    res.status(200).json({
      message: "OTP is valid.",
      status: true,
    });
  } else {
    await OTPModel.deleteOne({ email, otp });
    res.status(400).json({ message: "Invalid OTP." });
  }
});

exports.updateUserSkills = BigPromise(async (req, res, next) => {
  const { userSkills } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { userSkills },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    user,
  });
});
