const User = require("../models/user");
const Job = require("../models/jobs");
const Company = require("../models/company");
const BigPromise = require("../middlewares/bigPromise");
const cookieToken = require("../utils/cookieToken");
const CustomError = require("../utils/customError");

exports.companyUserLogin = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError("Please provide all the required fields", 400);
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || user.userType !== "COMPANY") {
    throw new CustomError("Invalid credentials", 401);
  }

  // add companyId to user

  const company = await Company.findOne({ companyUsers: user._id });

  if (!company) {
    throw new CustomError("Invalid credentials", 401);
  }

  user.companyId = company._id;

  const isPasswordCorrect = await user.isValidatedPassword(password);

  if (!isPasswordCorrect) {
    throw new CustomError("Invalid credentials", 401);
  }

  cookieToken(user, res);
});

exports.addCompany = BigPromise(async (req, res, next) => {
  //Add a user

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    // generate password from name and email
    password: req.body.password,
    userType: "COMPANY",
  });

  const company = await Company.create({
    companyName: req.body.companyName,
    companyEmail: req.body.companyEmail,
    companyPhone: req.body.companyPhone,
    companyWebsite: req.body.companyWebsite,
    companyAddress: req.body.companyAddress,
    companyDescription: req.body.companyDescription,
    companyCategory: req.body.companyCategory,
    companyUsers: user._id,
  });
  res.status(200).json({
    success: true,
    message: "Company added successfully",
    data: company,
  });
});

exports.getCompanyDetails = BigPromise(async (req, res, next) => {
  const company = await Company.findById(req.params.id);
  const user = req.user;
  res.status(200).json({
    success: true,
    message: "Company details",
    data: {
      ...company.toObject(),
      ...user.toObject(),
    },
  });
});

exports.updateCompanyDetails = BigPromise(async (req, res, next) => {
  const newData = req.body;
  const companyId = req.params.companyId;

  // console.log("newData", newData);

  const company = await Company.findByIdAndUpdate(companyId, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    company,
  });
});
