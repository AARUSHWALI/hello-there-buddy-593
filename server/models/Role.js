// models/Role.js
const RoleSchema = new mongoose.Schema({
    uuid: { type: String, required: true, unique: true },
    job_role: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('Role', RoleSchema);