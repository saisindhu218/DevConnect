const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const Project = require("../models/Project");
const User = require("../models/User");

/**
 * ✅ Create a new collaboration project
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, description, skills } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    // Get user details for owner name
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const project = new Project({
      title,
      description,
      skills,
      owner: req.user.id,
      code: "// Start coding here...",
      language: "javascript",
    });

    await project.save();
    
    // Populate the response
    const populatedProject = await Project.findById(project._id)
      .populate("owner", "firstName lastName username");
    
    res.status(201).json({
      _id: populatedProject._id,
      title: populatedProject.title,
      description: populatedProject.description,
      skills: populatedProject.skills,
      owner: populatedProject.owner._id,
      ownerName: `${populatedProject.owner.firstName || ''} ${populatedProject.owner.lastName || ''}`.trim() || populatedProject.owner.username,
      code: populatedProject.code,
      language: populatedProject.language
    });
  } catch (err) {
    console.error("❌ Error creating project:", err);
    res.status(500).json({ message: "Error creating project" });
  }
});

/**
 * ✅ Get all projects (for listing)
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("owner", "firstName lastName username")
      .populate("collaborators", "firstName lastName username")
      .populate("pendingRequests", "firstName lastName username");

    const formatted = projects.map((p) => ({
      _id: p._id.toString(),
      title: p.title,
      description: p.description,
      skills: p.skills || [],
      owner: p.owner?._id?.toString(),
      ownerName: p.owner ? 
        `${p.owner.firstName || ''} ${p.owner.lastName || ''}`.trim() || p.owner.username : 
        "Unknown",
      collaborators: (p.collaborators || []).map((c) => ({
        _id: c._id.toString(),
        name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.username,
      })),
      pendingRequests: (p.pendingRequests || []).map((r) => ({
        _id: r._id.toString(),
        name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.username,
      })),
      code: p.code || "",
      language: p.language || "javascript",
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    res.status(500).json({ message: "Error fetching projects" });
  }
});

/**
 * ✅ Request to join a project
 */
router.post("/:id/request", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user.id.toString();

    if (project.owner.toString() === userId)
      return res.status(400).json({ message: "You are the owner" });

    if (project.pendingRequests.map(String).includes(userId))
      return res.status(400).json({ message: "Request already sent" });

    if (project.collaborators.map(String).includes(userId))
      return res.status(400).json({ message: "Already a collaborator" });

    project.pendingRequests.push(userId);
    await project.save();

    res.json({ message: "Request sent successfully" });
  } catch (err) {
    console.error("❌ Error sending request:", err);
    res.status(500).json({ message: "Error sending request" });
  }
});

/**
 * ✅ Approve a collaboration request
 */
router.post("/:id/approve", verifyToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.owner.toString() !== req.user.id.toString())
      return res.status(403).json({ message: "Not authorized" });

    project.pendingRequests = project.pendingRequests.filter(
      (r) => r.toString() !== userId
    );

    if (!project.collaborators.map(String).includes(userId)) {
      project.collaborators.push(userId);
    }

    await project.save();
    res.json({ message: "User approved successfully" });
  } catch (err) {
    console.error("❌ Error approving collaborator:", err);
    res.status(500).json({ message: "Error approving collaborator" });
  }
});

/**
 * ✅ Get single project for collaboration room
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "firstName lastName username")
      .populate("collaborators", "firstName lastName username");

    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user.id.toString();
    const collaboratorIds = project.collaborators.map((c) => c._id.toString());
    const isCollaborator = collaboratorIds.includes(userId);
    const isOwner = project.owner._id.toString() === userId;

    if (!isOwner && !isCollaborator)
      return res.status(403).json({ message: "Not authorized" });

    res.json({
      _id: project._id.toString(),
      title: project.title,
      description: project.description,
      skills: project.skills || [],
      owner: project.owner._id.toString(),
      ownerName: `${project.owner.firstName || ''} ${project.owner.lastName || ''}`.trim() || project.owner.username,
      collaborators: project.collaborators.map((c) => ({
        _id: c._id.toString(),
        name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.username,
      })),
      code: project.code || "",
      language: project.language || "javascript",
    });
  } catch (err) {
    console.error("❌ Error fetching project:", err);
    res.status(500).json({ message: "Error fetching project" });
  }
});

/**
 * ✅ Save or update project code + language (persistent)
 */
router.put("/:id/code", verifyToken, async (req, res) => {
  try {
    const { code, language } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user.id.toString();
    if (
      project.owner.toString() !== userId &&
      !project.collaborators.map(String).includes(userId)
    ) {
      return res.status(403).json({ message: "Not authorized to edit" });
    }

    if (code !== undefined) project.code = code;
    if (language !== undefined) project.language = language;

    await project.save();

    res.json({
      message: "Code and language saved successfully ✅",
      code: project.code,
      language: project.language,
    });
  } catch (err) {
    console.error("❌ Error saving code:", err);
    res.status(500).json({ message: "Error saving code" });
  }
});

module.exports = router;