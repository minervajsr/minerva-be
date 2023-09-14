const express = require("express");
const router = express.Router();

const {
  companyUserLogin,
  addCompany,
  getCompanyDetails,
  updateCompanyDetails,
} = require("../controllers/companyControllers");
const { isLoggedIn } = require("../middlewares/user");

router.route("/company-user-login").post(companyUserLogin);
router.route("/add-company").post(addCompany);
router.route("/company/:id").get(isLoggedIn, getCompanyDetails);
router
  .route("/update-company/:companyId")
  .post(isLoggedIn, updateCompanyDetails);

module.exports = router;
