const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const User = require("../models/User");

/**
 * ✅ PUBLIC ROUTES
 */

// ✅ Check username availability
router.get("/check-username", async (req, res) => {
  try {
    const username = (req.query.username || "").trim();
    if (!username) return res.status(400).json({ message: "Username required" });

    const exists = await User.exists({ username });
    return res.json({ available: !exists });
  } catch (err) {
    console.error("Error checking username:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Check email availability
router.get("/check-email", async (req, res) => {
  try {
    const email = (req.query.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email required" });

    const exists = await User.exists({ email });
    return res.json({ available: !exists });
  } catch (err) {
    console.error("Error checking email:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ✅ PROTECTED ROUTES
 * Require JWT authentication via verifyToken
 */

// ✅ Get current logged-in user
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -refreshToken")
      .populate("posts", "body createdAt media");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ message: "Error fetching current user" });
  }
});

// ✅ Get all users (for network page etc.) - UPDATED with better error handling
router.get("/", verifyToken, async (req, res) => {
  try {
    console.log("🔄 Fetching all users...");
    
    const users = await User.find()
      .select("-password -refreshToken -email") // Exclude sensitive info
      .populate("posts", "body createdAt media")
      .lean(); // Better performance

    console.log(`✅ Found ${users.length} users`);
    
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// ✅ Get user by ID (individual profiles)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -refreshToken")
      .populate({
        path: "posts",
        select: "body createdAt media",
        options: { sort: { createdAt: -1 } }
      });

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    res.status(500).json({ message: "Error fetching user" });
  }
});

// ✅ Follow or Unfollow another user - FIXED endpoint consistency
router.post("/follow/:id", verifyToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    const userId = req.user.id;

    console.log(`🔄 Follow/Unfollow: User ${userId} -> Target ${targetId}`);

    if (userId === targetId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const user = await User.findById(userId);
    const target = await User.findById(targetId);

    if (!user || !target) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFollowing = user.following.includes(targetId);
    
    if (alreadyFollowing) {
      // Unfollow
      user.following.pull(targetId);
      target.followers.pull(userId);
      await user.save();
      await target.save();
      
      res.json({ 
        message: "Unfollowed successfully",
        action: "unfollowed"
      });
    } else {
      // Follow
      user.following.addToSet(targetId);
      target.followers.addToSet(userId);
      await user.save();
      await target.save();
      
      res.json({ 
        message: "Followed successfully",
        action: "followed"
      });
    }
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ message: "Error updating follow status" });
  }
});

// ✅ Update user profile info
router.put("/update", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      bio,
      location,
      skills,
      experience,
      education,
    } = req.body;

    // Normalize inputs
    const normalizedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const normalizedExperience = Array.isArray(experience)
      ? experience.map((exp) => ({
          title: exp.title?.trim() || "",
          company: exp.company?.trim() || "",
          years: exp.years?.trim() || "",
        }))
      : [];

    const normalizedEducation = Array.isArray(education)
      ? education.map((edu) => ({
          school: edu.school?.trim() || "",
          degree: edu.degree?.trim() || "",
          years: edu.years?.trim() || "",
        }))
      : [];

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        bio,
        location,
        skills: normalizedSkills,
        experience: normalizedExperience,
        education: normalizedEducation,
      },
      { new: true, runValidators: true }
    )
      .select("-password -refreshToken")
      .populate({
        path: "posts",
        select: "body createdAt media",
        options: { sort: { createdAt: -1 } }
      });

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Error updating profile" });
  }
});

module.exports = router;