const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verifyToken } = require("../middlewares/authMiddleware");
const Post = require("../models/Post");
const User = require("../models/User");

// ✅ Ensure uploads directory exists
const uploadDir = path.resolve(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Created uploads folder at:", uploadDir);
}

// ✅ Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const cleanName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${uniqueSuffix}-${cleanName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ✅ Create Post
router.post("/", verifyToken, upload.array("media", 5), async (req, res) => {
  try {
    const { body } = req.body;

    if (!body && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: "Post content or media required" });
    }

    const fileUrls = (req.files || []).map((file) => {
      const filename = path.basename(file.path);
      return `/uploads/${filename}`;
    });

    const post = new Post({
      author: req.user.id,
      body,
      media: { images: fileUrls },
      likes: [],
      comments: [],
    });

    await post.save();

    // Add post to user's posts array
    await User.findByIdAndUpdate(
      req.user.id, 
      { $addToSet: { posts: post._id } }
    );

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "username firstName lastName avatar"
    );

    res.status(201).json({
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (err) {
    console.error("❌ Error creating post:", err);
    res.status(500).json({ message: "Error creating post" });
  }
});

// ✅ Get all posts for feed
router.get("/", verifyToken, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username firstName lastName avatar")
      .sort({ createdAt: -1 });
    res.json({ posts });
  } catch (err) {
    console.error("❌ Error fetching posts:", err);
    res.status(500).json({ message: "Error fetching posts" });
  }
});

// ✅ Get posts by specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate("author", "username firstName lastName avatar")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error("❌ Error fetching user posts:", err);
    res.status(500).json({ message: "Error fetching user posts" });
  }
});

// ✅ LIKE/UNLIKE POST
router.post("/:id/like", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user.id;
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      liked: !hasLiked,
      likes: post.likes,
      message: hasLiked ? "Post unliked" : "Post liked"
    });
  } catch (err) {
    console.error("❌ Error liking post:", err);
    res.status(500).json({ message: "Error updating like" });
  }
});

// ✅ ADD COMMENT TO POST
router.post("/:id/comments", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment text required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = {
      author: req.user.id,
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    // Populate author info in the response
    const populatedPost = await Post.findById(req.params.id)
      .populate("comments.author", "username firstName lastName avatar")
      .populate("author", "username firstName lastName avatar");

    const addedComment = populatedPost.comments[populatedPost.comments.length - 1];

    res.status(201).json(addedComment);
  } catch (err) {
    console.error("❌ Error adding comment:", err);
    res.status(500).json({ message: "Error adding comment" });
  }
});

module.exports = router;