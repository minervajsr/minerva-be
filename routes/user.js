const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  logout,
  forgotPassword,
  getLoggedInUserDetails,
  getLoggedInUserResume,
  changePassword,
  updateUserDetails,
  uploadResume,
  passwordReset,
  googleLogin,
  linkedinLogin,
  emailVerification,
  verifyEmailOTP,
} = require("../controllers/userControllers");

const { isLoggedIn } = require("../middlewares/user");

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/forgot-password").post(forgotPassword);
router.route("/password-reset/:token").post(passwordReset);
router.route("/email-verification").post(emailVerification);
router.route("/email-verification/verify").post(verifyEmailOTP);
router.route("/user").get(isLoggedIn, getLoggedInUserDetails);
router.route("/user/resume").get(isLoggedIn, getLoggedInUserResume);
router.route("/user/password-update").post(changePassword);
router.route("/user/update").post(isLoggedIn, updateUserDetails);
router.route("/user/check-token").get(isLoggedIn, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token is valid",
    user: req.user,
  });
});

//Upload Resume
router.route("/user/upload-resume").post(isLoggedIn, uploadResume);

// Google OAuth

// Route to exchange code for tokens
router.route("/auth/google").post(googleLogin);
router.route("/auth/linkedin").post(linkedinLogin);

module.exports = router;
