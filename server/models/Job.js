// models/Job.js
const JobSchema = new mongoose.Schema({
    uuid: { type: String, required: true, unique: true },
    job_name: { type: String, required: true },
    job_description: { type: String },
    required_qualifications: { type: [String] },
    updated_at: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('Job', JobSchema);
  