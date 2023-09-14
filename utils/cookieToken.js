const cookieToken = (user, res) => {
  const token = user.getJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    sameSite: "None",
    secure: true,
    httpOnly: true,
  };
  console.log(user.companyId);

  user.password = undefined;
  res
    .status(200)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: {
        ...user.toObject(),
        companyId: user.companyId,
      },
    });
};

module.exports = cookieToken;
