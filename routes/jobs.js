const express = require("express");
const router = express.Router();

const {
  postJob,
  updateJob,
  getJobDetails,
  getJobDetailsForCompany,
  searchJob,
  updateJobStatus,
  applyJob,
  updateCandidateStatus,
} = require("../controllers/jobControllers");
const { isLoggedIn } = require("../middlewares/user");

router.route("/post-job").post(postJob);
router.route("/update-job").post(updateJob);
router.route("/update-job-status").post(updateJobStatus);
router.route("/job/:id").get(isLoggedIn, getJobDetails);
router.route("/company-job/:id").get(isLoggedIn, getJobDetailsForCompany);
router.route("/search").get(isLoggedIn, searchJob);
router.route("/apply/:id").post(isLoggedIn, applyJob);
router
  .route("/update-candidate-status")
  .post(isLoggedIn, updateCandidateStatus);

module.exports = router;
