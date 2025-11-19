const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  skills: [String],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // ✅ Persist code + language in IDE
  code: { type: String, default: "// Start coding here..." },
  language: { type: String, default: "javascript" },
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);
