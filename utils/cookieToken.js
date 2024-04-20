const cookieToken = (user, res) => {
  const token = user.getJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    sameSite: "Lax",
    secure: false,
    // httpOnly: true,
  };
  // console.log(user.companyId);

  user.password = undefined;
  res
    .status(200)
    .cookie("auth_token", token, options)
    .json({
      success: true,
      token,
      user: {
        ...user.toObject(),
        companyId: user.companyId,
        token,
      },
    });
};

module.exports = cookieToken;
