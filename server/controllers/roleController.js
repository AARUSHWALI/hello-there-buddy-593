// controllers/roleController.js
const Role = require('../models/Role');

exports.getAllRoles = async (req, res) => {
  const roles = await Role.find();
  res.json(roles);
};

exports.createRole = async (req, res) => {
  const newRole = new Role({ ...req.body, uuid: crypto.randomUUID() });
  await newRole.save();
  res.status(201).json(newRole);
};