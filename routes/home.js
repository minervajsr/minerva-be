const express = require("express");
const router = express.Router();

const {
  home,
  getDashboard,
  companyUserDashboard,
} = require("../controllers/homeControllers");

router.route("/home").get(home);
router.route("/dashboard/:id").get(getDashboard);
router.route("/company-user-dashboard/:id").get(companyUserDashboard);

module.exports = router;
