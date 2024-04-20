const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    required: [true, "Please add a job title"],
    trim: true,
    maxlength: [50, "Job title cannot be more than 50 characters"],
  },
  jobDescription: {
    type: String,
    required: [true, "Please add a job description"],
    trim: true,
  },
  jobSkills: {
    type: [String],
  },
  jobType: {
    type: String,
    enum: ["FULL_TIME", "PART_TIME", "INTERNSHIP", "FREELANCE"],
    default: "FULL_TIME",
  },
  jobLocation: {
    type: String,
    required: [true, "Please add a job location"],
    trim: true,
    maxlength: [50, "Job location cannot be more than 50 characters"],
  },
  jobSalary: {
    min: {
      type: Number,
      required: [true, "Please add a minimum salary"],
      trim: true,
      maxlength: [50, "Minimum salary cannot be more than 50 characters"],
    },
    max: {
      type: Number,
      required: [true, "Please add a maximum salary"],
      trim: true,
      maxlength: [50, "Maximum salary cannot be more than 50 characters"],
    },
  },
  jobPostedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  jobPostedAt: {
    type: Date,
    default: Date.now,
  },
  jobApplications: [
    {
      jobAppliedOn: {
        type: Date,
        default: Date.now,
      },
      candidateId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      candidateStatus: {
        type: String,
        enum: ["NEW", "SHORTLISTED", "REJECTED", "HIRED"],
        default: "NEW",
      },
      candidateScreeningAnswers: { type: [String] },
      candidateResume: {
        id: {
          type: String,
          required: true,
        },
        secure_url: {
          type: String,
          required: true,
        },
        fileName: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
      },
    },
  ],
  jobBenefits: {
    type: [String],
  },
  keyResponsibilities: {
    type: [String],
  },
  jobVacancies: {
    type: Number,
    required: [true, "Please add number of vacancies"],
    trim: true,
    maxlength: [50, "Number of vacancies cannot be more than 50 characters"],
  },
  jobStatus: {
    type: String,
    enum: ["OPEN", "CLOSED"],
    default: "OPEN",
  },
  jobDeadline: {
    type: Date,
    required: [true, "Please add a deadline"],
  },

  jobCompany: {
    type: mongoose.Schema.ObjectId,
    ref: "Company",
    required: true,
  },
  jobCategory: {
    type: String,
    enum: [
      "IT",
      "FINANCE",
      "MARKETING",
      "SALES",
      "HR",
      "DESIGN",
      "OTHERS",
      "ANALYTICS",
      "ENGINEERING",
    ],
    default: "OTHERS",
  },
  jobScreeningQuestions: [
    {
      question: {
        type: String,
        required: [true, "Please add a question"],
        trim: true,
        maxlength: [500, "Question cannot be more than 500 characters"],
      },
      answer: {
        type: String,
        required: [true, "Please add an answer"],
        trim: true,
        maxlength: [500, "Answer cannot be more than 500 characters"],
      },
    },
  ],
});

module.exports = mongoose.model("Job", jobSchema);
