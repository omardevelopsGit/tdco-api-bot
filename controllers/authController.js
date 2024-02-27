const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const Project = require('./../models/projectModel.js');
const catchAsync = require('./../utils/apiCatcher.js');
const AppError = require('./../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXP,
  });
};

function verifyToken(token) {
  return new Promise((res, rej) => {
    jwt.verify(token, process.env.JWT_SECRET, {}, (err, decoded) => {
      if (err) rej(err);
      else res(decoded);
    });
  });
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.COOKIE_EXP * 1),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    data: {
      user,
    },
  });
};

exports.finalSignup = catchAsync(async (req, res, next) => {
  const discordIdToken = req.body.id;
  if (!discordIdToken) return next(new AppError('Please provide id token'));
  const { discordId } = await verifyToken(discordIdToken);
  const user = await User.findOneAndUpdate(
    { discordId },
    {
      name: req.body.name,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    }
  );

  if (!user) return next(new AppError('You must be authed to do this', 403));

  createSendToken(user, 200, res);
});

exports.firstSignup = catchAsync(async (req, res, next) => {
  const discordId = req.body.id;
  console.log(req.body);
  if (!discordId)
    return next(new AppError('Please provide discord user id', 400));

  const user = new User({
    discordId,
  });

  await user.save({ validateBeforeSave: false });

  const discordToken = jwt.sign({ discordId }, process.env.JWT_SECRET, {
    expiresIn: 600000, //10 Minutes
  });

  res.status(200).json({
    status: 'success',
    data: {
      discordToken,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  // 1) Check if email and password exist
  if (!username || !password) {
    return next(new AppError('Please provide username and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ username }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  const token = req.cookies?.jwt;

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await verifyToken(token);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.addProjectToUser = catchAsync(async (req, res, next) => {
  const project = await Project.findOne({ discordCatId: req.params.projectId });
  if (!project) return next(new AppError('Could not find this project', 404));

  // It must be discord user id
  const user = await User.findOneAndUpdate(
    { discordId: req.params.userId },
    {
      $push: { projects: { project: project._id, role: req.body.role } },
    }
  );

  if (!user) return next(new AppError('Could not find this user', 404));

  console.log(req.body.role);
  project.members.push({
    role: req.body.role,
    user: { discordId: req.params.userId, docId: user._id },
  });

  await project.save();

  res.status(200).json({
    status: 'success',
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user =
    req.query.id_type === 'discord'
      ? await User.findOne({ discordId: req.params.id })
      : await User.findById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.restrict = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
