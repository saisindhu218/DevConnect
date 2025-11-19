const express = require("express");
const router = express.Router();
const Blog = require("../models/Blog");
const Comment = require("../models/Comment");
const { verifyToken } = require("../middlewares/authMiddleware");

// =============================
// GET ALL BLOGS
// =============================
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });

    const result = await Promise.all(
      blogs.map(async (b) => {
        const commentCount = await Comment.countDocuments({ blogId: b._id });
        return { ...b.toObject(), commentCount };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ message: "Error fetching blogs" });
  }
});

// =============================
// GET SINGLE BLOG
// =============================
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    blog.views = (blog.views || 0) + 1;
    await blog.save();

    const comments = await Comment.find({ blogId: blog._id }).sort({
      createdAt: -1,
    });

    res.json({ blog, comments });
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).json({ message: "Error fetching blog" });
  }
});

// =============================
// CREATE BLOG  (AUTH)
// =============================
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, author, excerpt, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content required" });
    }

    const finalExcerpt =
      excerpt && excerpt.trim().length > 0
        ? excerpt.trim()
        : content.length > 180
        ? content.slice(0, 180).trim() + "..."
        : content;

    const newBlog = await Blog.create({
      title,
      excerpt: finalExcerpt,
      content,
      author: author || req.user.username, // fallback
      authorId: req.user._id,
      views: 0,
    });

    res.status(201).json(newBlog);
  } catch (err) {
    console.error("Create blog error:", err);
    res.status(500).json({ message: "Error creating blog" });
  }
});

// =============================
// UPDATE BLOG (OWNER ONLY)
// =============================
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { title, excerpt, author, content } = req.body;

    const finalExcerpt =
      excerpt && excerpt.trim().length > 0
        ? excerpt.trim()
        : content.length > 180
        ? content.slice(0, 180).trim() + "..."
        : content;

    blog.title = title || blog.title;
    blog.excerpt = finalExcerpt;
    blog.content = content || blog.content;
    blog.author = author || blog.author;

    await blog.save();

    res.json(blog);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Error updating blog" });
  }
});

// =============================
// DELETE BLOG  (OWNER ONLY)
// =============================
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await blog.deleteOne();
    await Comment.deleteMany({ blogId: req.params.id });

    res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Error deleting blog" });
  }
});

// =============================
// ADD COMMENT (AUTH)
// =============================
router.post("/:id/comments", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment text required" });
    }

    const newComment = await Comment.create({
      blogId: req.params.id,
      author: req.user.username,
      text,
    });

    res.status(201).json(newComment);
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ message: "Error adding comment" });
  }
});

module.exports = router;
