// routes/auth.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  register,
  login,
  logout,
  getMe,
  updatePassword,
} = require('../controllers/authController');

// Public routes
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('fname').notEmpty().withMessage('First name is required'),
    body('lname').notEmpty().withMessage('Last name is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  validate,
  login
);

// Protected routes (require authentication)
router.use(authenticate);

router.get('/me', getMe);
router.get('/logout', logout);
router.patch(
  '/update-password',
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Please provide your current password'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
  ],
  validate,
  updatePassword
);

module.exports = router;