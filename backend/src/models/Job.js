const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    salary: { type: String, default: "" },
    type: { type: String, required: true },
    tags: { type: [String], default: [] },
    applyUrl: { type: String, required: true },
    posted: { type: String, default: "Just now" },

    // ⭐ NEW: Track job creator
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Job", JobSchema);
