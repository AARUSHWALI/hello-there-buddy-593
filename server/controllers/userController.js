// controllers/userController.js
const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

exports.getUserById = async (req, res) => {
  const user = await User.findOne({ uuid: req.params.uuid });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};