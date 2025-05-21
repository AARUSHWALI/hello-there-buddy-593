// controllers/jobController.js
const Job = require('../models/Job');

exports.getAllJobs = async (req, res) => {
  const jobs = await Job.find();
  res.json(jobs);
};

exports.createJob = async (req, res) => {
  const newJob = new Job({ ...req.body, uuid: crypto.randomUUID() });
  await newJob.save();
  res.status(201).json(newJob);
};