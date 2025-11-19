// backend/src/routes/Jobs.js
const express = require("express");
const Job = require("../models/Job");
const { verifyToken } = require("../middlewares/authMiddleware");
const router = express.Router();

// ⭐ GET all jobs + search + filters (PUBLIC - no auth required)
router.get("/", async (req, res) => {
  try {
    const { search, location, type, tag } = req.query;
    const filter = {};

    if (search) filter.title = { $regex: search, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };
    if (type) filter.type = type;
    if (tag) filter.tags = { $in: [new RegExp(tag, "i")] };

    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

// ⭐ GET job by ID (PUBLIC - no auth required)
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json({ job });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ message: "Error fetching job" });
  }
});

// ⭐ POST a job (PROTECTED - requires authentication)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, company, location, salary, type, tags, applyUrl } = req.body;

    // ✅ ADDED: Input validation
    if (!title || !company || !location || !type || !applyUrl) {
      return res.status(400).json({ 
        message: "Title, company, location, type, and apply URL are required" 
      });
    }

    const job = await Job.create({
      title,
      company,
      location,
      salary: salary || "",
      type,
      tags: tags || [],
      applyUrl,
      createdBy: req.user.id, // ⭐ Set the user who created the job
    });

    res.status(201).json({ 
      message: "Job posted successfully",
      job 
    });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ message: "Error creating job" });
  }
});

// ⭐ UPDATE job — ONLY owner can edit (PROTECTED)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this job" });
    }

    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({ 
      message: "Job updated successfully",
      job: updated 
    });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ message: "Error updating job" });
  }
});

// ⭐ DELETE job — ONLY owner can delete (PROTECTED)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this job" });
    }

    await job.deleteOne();
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ message: "Error deleting job" });
  }
});

module.exports = router;