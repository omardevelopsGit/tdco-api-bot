const User = require('../models/userModel.js');
const catchAsync = require('../utils/apiCatcher.js');
const AppError = require('../utils/appError.js');

exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).render('pages/profile', {
    title: 'Profile',
  });
});

exports.getSignup = catchAsync(async (req, res, next) => {
  if (!req.query.discordToken)
    return next(
      new AppError('The signup process must be approved by an admin', 403)
    );
  res.status(200).render('pages/signup', {
    title: 'Signup',
    discordToken: req.query.discordToken,
  });
});

exports.getLogin = catchAsync(async (req, res, next) => {
  res.status(200).render('pages/login', {
    title: 'Login',
  });
});
