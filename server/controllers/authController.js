// controllers/authController.js
const Auth = require('../models/Auth');
const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/appError');
const { createSendToken } = require('../utils/token');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    // 1) Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password, fname, lname, phone } = req.body;

    // 2) Check if user already exists
    const existingUser = await Auth.findOne({ email });
    if (existingUser) {
      return next(
        new AppError('Email already in use', StatusCodes.BAD_REQUEST)
      );
    }

    // 3) Create new user
    const newUser = await Auth.create({
      uuid: require('crypto').randomUUID(),
      email,
      password,
      fname,
      lname,
      phone,
    });

    // 4) Generate token and send response
    createSendToken(newUser, StatusCodes.CREATED, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(
        new AppError('Please provide email and password', StatusCodes.BAD_REQUEST)
      );
    }

    // 2) Check if user exists && password is correct
    const user = await Auth.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(
        new AppError('Incorrect email or password', StatusCodes.UNAUTHORIZED)
      );
    }

    // 3) Update last login
    user.last_login = Date.now();
    await user.save({ validateBeforeSave: false });

    // 4) If everything ok, send token to client
    createSendToken(user, StatusCodes.OK, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Successfully logged out',
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await Auth.findById(req.user.id);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password
// @route   PATCH /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    // 1) Get user from collection
    const user = await Auth.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
      return next(
        new AppError('Your current password is wrong', StatusCodes.UNAUTHORIZED)
      );
    }

    // 3) If so, update password
    user.password = req.body.newPassword;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, StatusCodes.OK, res);
  } catch (error) {
    next(error);
  }
};