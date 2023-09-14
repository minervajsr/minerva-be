const User = require("../models/user");
const Job = require("../models/jobs");
const BigPromise = require("../middlewares/bigPromise");
const jobFilter = require("../utils/jobFilter");

exports.home = BigPromise(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Minerva",
  });
});

exports.getDashboard = BigPromise(async (req, res, next) => {
  const userSkills = await User.findById(req.params.id).select("userSkills");

  // console.log("userSkills", userSkills);
  const jobs = await Job.find().populate(
    "jobCompany",
    "companyName companyDescription companyWebsite companyAddress companyEmail"
  );
  const filteredAndSortedJobs = jobFilter(jobs, userSkills.userSkills);

  res.status(200).json({
    success: true,
    message: "Welcome to Minerva",
    recommendedJobs: filteredAndSortedJobs,
  });
});

exports.companyUserDashboard = BigPromise(async (req, res, next) => {
  // find jobs by company id and user id
  const jobs = await Job.find({
    jobPostedBy: req.params.id,
  }).populate(
    "jobCompany",
    "companyName companyDescription companyWebsite companyAddress companyEmail"
  );

  res.status(200).json({
    success: true,
    message: "Welcome to Minerva",
    jobs,
  });
});
