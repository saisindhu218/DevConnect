// backend/src/models/Blog.js
const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },

    // readable name
    author: { type: String, required: true },

    // actual user reference
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);
