const User = require("../models/user");
const Job = require("../models/jobs");
const jobFilter = require("../utils/jobFilter");
const mongoose = require("mongoose");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const { jobApplicationEmail } = require("../utils/email");

exports.postJob = BigPromise(async (req, res, next) => {
  try {
    const {
      jobTitle,
      jobDescription,
      jobSkills,
      jobType,
      jobLocation,
      jobSalary,
      jobBenefits,
      jobVacancies,
      jobDeadline,
      jobCategory,
      jobScreeningQuestions,
      keyResponsibilities,
    } = req.body;

    // Assuming you're passing the logged-in user's ID in req.user.id
    const jobPostedBy = req.body.userId;

    // Assuming you're passing the company's ID in req.company.id
    const jobCompany = req.body.companyId;

    // Create a new job instance
    const newJob = new Job({
      jobTitle,
      jobDescription,
      jobSkills,
      jobType,
      jobLocation,
      jobSalary,
      jobPostedBy,
      jobBenefits,
      jobVacancies,
      jobDeadline,
      jobCompany,
      jobCategory,
      jobScreeningQuestions,
      keyResponsibilities,
    });

    // Save the job in the database
    const savedJob = await newJob.save();

    res.status(201).json({
      success: true,
      message: "Job posted successfully",
      data: savedJob,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to post job",
      error: error.message,
    });
  }
});

exports.updateJobStatus = BigPromise(async (req, res, next) => {
  const { jobId, jobStatus } = req.body;

  // Check if the job exists
  const job = Job.findById(jobId);
  if (!job) {
    return next(new CustomError("Job not found", 404));
  }

  // Update the job status
  const updatedJob = await Job.findByIdAndUpdate(jobId, {
    jobStatus,
  });

  if (!updatedJob) {
    return next(new CustomError("Failed to update job status", 500));
  }

  res.status(200).json({
    success: true,
    message: "Job status updated successfully",
    data: updatedJob,
  });
});

exports.updateJob = BigPromise(async (req, res, next) => {
  const jobData = req.body;

  // Find the job by ID and update it

  const updatedJob = await Job.findByIdAndUpdate(jobData._id, jobData, {
    new: true, // This option returns the updated document
    runValidators: true, // This option ensures the data passed to update is validated
  });

  if (!updatedJob) {
    return next(new CustomError("Failed to update job", 500));
  }

  res.status(200).json({
    success: true,
    message: "Job updated successfully",
    data: updatedJob,
  });
});

exports.getJobDetails = BigPromise(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate(
    "jobCompany",
    "companyName companyDescription companyWebsite companyAddress companyEmail"
  );

  if (!job) {
    return next(new CustomError("Job not found", 404));
  }
  // console.log("userId", req.user._id);
  const userSkills = await User.findById(req.user._id).select("userSkills");
  const jobs = await Job.find().populate(
    "jobCompany",
    "companyName companyDescription companyWebsite companyAddress companyEmail"
  );

  const filteredJob = jobs.filter((job) => {
    return job._id != req.params.id;
  });

  console.log("JobId", req.params.id);

  //check if user already applied for the job

  const isAlreadyApplied = job.jobApplications.some((application) =>
    application.candidateId.equals(req.user._id)
  );

  if (isAlreadyApplied) {
    job.isAlreadyApplied = true;
  }

  const filteredAndSortedJobs = jobFilter(
    filteredJob,
    userSkills.userSkills
  ).slice(0, 3);

  res.status(200).json({
    success: true,
    message: "Job details retrieved successfully",
    data: { ...job.toObject(), isAlreadyApplied },
    recommendedJobs: filteredAndSortedJobs,
  });
});

exports.getJobDetailsForCompany = BigPromise(async (req, res, next) => {
  const job = await Job.findById(req.params.id)
    .populate("jobCompany") // Populate the jobCompany field
    .populate("jobApplications.candidateId"); // Populate the candidateId field inside jobApplications

  if (!job) {
    return next(new CustomError("Job not found", 404));
  }

  console.log("job", job.jobApplications);
  res.status(200).json({
    success: true,
    message: "Job details retrieved successfully",
    data: job,
  });
});

exports.searchJob = BigPromise(async (req, res, next) => {
  const { keyword, location, jobType, skills, salaryRange } = req.query;

  // Fetch jobs data from a source (e.g., database)
  const jobs = await Job.find().populate(
    "jobCompany",
    "companyName companyDescription companyWebsite companyAddress companyEmail"
  );

  // Filter jobs based on the keyword
  let matchingJobs = jobs.filter((job) => {
    const keywordLower = keyword.toLowerCase();

    return (
      job.jobTitle.toLowerCase().includes(keywordLower) ||
      job.jobDescription.toLowerCase().includes(keywordLower) ||
      job.jobLocation.toLowerCase().includes(keywordLower) ||
      job.jobCategory.toLowerCase().includes(keywordLower) ||
      job.jobBenefits.some((benefit) =>
        benefit.toLowerCase().includes(keywordLower)
      ) ||
      job.jobSkills.some((skill) => skill.toLowerCase().includes(keywordLower))
    );
  });

  // Filter jobs based on jobType
  if (jobType && jobType.length > 0) {
    const filteredJobsByType = matchingJobs.filter((job) =>
      jobType.includes(job.jobType)
    );
    matchingJobs = filteredJobsByType;
  }

  // Filter jobs based on skills
  if (skills) {
    const skillsArray = skills.split(",");
    const filteredJobsBySkills = matchingJobs.filter((job) =>
      skillsArray.every((skill) => job.jobSkills.includes(skill))
    );
    matchingJobs = filteredJobsBySkills;
  }

  // Filter jobs based on salaryRange
  if (salaryRange) {
    const [minSalary, maxSalary] = salaryRange.split(",").map(Number);
    const filteredJobsBySalary = matchingJobs.filter(
      (job) => job.jobSalary.min >= minSalary && job.jobSalary.max <= maxSalary
    );
    matchingJobs = filteredJobsBySalary;
  }

  // If location is provided, further filter by location
  if (location && location !== "Anywhere") {
    const locationLower = location.toLowerCase();
    const jobsInLocation = matchingJobs.filter((job) =>
      job.jobLocation.toLowerCase().includes(locationLower)
    );
    res.status(200).json(jobsInLocation);
  } else {
    res.status(200).json(matchingJobs);
  }
});

exports.applyJob = BigPromise(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate(
    "jobCompany",
    "companyName"
  );
  if (!job) {
    return next(new CustomError("Job not found", 404));
  }

  // Check if the user has already applied for the job
  const isAlreadyApplied = job.jobApplications.some((application) =>
    application.candidateId.equals(req.user._id)
  );

  if (isAlreadyApplied) {
    res.status(400).json({
      success: false,
      message: "You have already applied for this job",
    });
  }

  // Add the user's ID to the job's jobApplications array
  job.jobApplications.push({
    candidateStatus: "NEW",
    candidateScreeningAnswers: req.body.applicationData.answers || [],
    candidateId: req.user._id,
    candidateResume: req.user.userResume,
  });

  // Save the job in the database
  await job.save();

  // console.log(
  //   req.user.name,
  //   req.user.email,
  //   job.jobTitle,
  //   job.jobCompany,
  //   job.jobCompany.companyName,
  //   job.jobLocation,
  //   `${req.headers.origin}/job/${job._id}`
  // );

  jobApplicationEmail(
    req.user.name,
    req.user.email,
    job.jobTitle,
    job.jobCompany.companyName,
    job.jobLocation,
    `${req.headers.origin}/job/${job._id}`
  );

  res.status(200).json({
    success: true,
    message: "Applied for job successfully",
    data: {
      candidateStatus: "NEW",
      candidateScreeningAnswers: req.body.applicationData.answers || [],
      candidateId: req.user._id,
      candidateResume: req.user.userResume,
    },
  });
});

exports.updateCandidateStatus = BigPromise(async (req, res, next) => {
  const { jobId, candidateId, candidateStatus } = req.body;

  // Check if the job exists
  const job = await Job.findById(jobId);
  if (!job) {
    return next(new CustomError("Job not found", 404));
  }

  // Check if the candidate has applied for the job
  const isCandidateApplied = job.jobApplications.some((application) => {
    return application.candidateId.equals(candidateId);
  });
  if (!isCandidateApplied) {
    return next(new CustomError("Candidate has not applied for this job", 400));
  }

  const updatedJob = await Job.findOneAndUpdate(
    {
      _id: jobId,
      "jobApplications.candidateId": candidateId,
    },
    {
      $set: {
        "jobApplications.$.candidateStatus": candidateStatus,
      },
    },
    { new: true } // This option returns the updated document after the update
  );

  if (!updatedJob) {
    return next(new CustomError("Failed to update candidate status", 500));
  }

  res.status(200).json({
    success: true,
    message: "Candidate status updated successfully",
    candidate: updatedJob,
  });
});
