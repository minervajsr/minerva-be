const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, "Please add a company name"],
    trim: true,
    maxlength: [150, "Company name cannot be more than 150 characters"],
  },
  companyEmail: {
    type: String,
    required: [true, "Please add an email"],
    trim: true,
    maxlength: [50, "Email cannot be more than 50 characters"],
  },
  companyPhone: {
    type: String,
    required: [true, "Please add a phone number"],
    trim: true,
    maxlength: [50, "Phone number cannot be more than 50 characters"],
  },
  companyWebsite: {
    type: String,
    required: [true, "Please add a website"],
    trim: true,
    maxlength: [50, "Website cannot be more than 50 characters"],
  },
  companyAddress: {
    type: String,
    required: [true, "Please add an address"],
    trim: true,
    maxlength: [250, "Address cannot be more than 250 characters"],
  },
  // companyDescription: {
  //   type: String,
  //   required: [true, "Please add a description"],
  //   trim: true,
  //   maxlength: [250, "Description cannot be more than 250 characters"],
  // },
  companyUsers: {
    type: [mongoose.Schema.ObjectId],
    ref: "User",
  },

  companyCategory: {
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
  },
  companyCreatedAt: {
    type: Date,
    default: Date.now,
  },
  companyUpdatedAt: {
    type: Date,
    default: Date.now,
  },
  companyPostedJobs: {
    type: [mongoose.Schema.ObjectId],
    ref: "Job",
  },
});

module.exports = mongoose.model("Company", CompanySchema);
