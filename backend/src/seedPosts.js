// backend/src/seedPosts.js
const mongoose = require("mongoose");
const Post = require("./models/Post");

async function seedPosts(users) {
  try {
    console.log("📝 Seeding posts...");

    await Post.deleteMany();

    const posts = [
      {
        author: users[0]._id,
        body: "Excited to join DevConnect 🚀",
        media: { images: [], videos: [] },
      },
      {
        author: users[1]._id,
        body: "Working on a MERN stack mini project today!",
        media: { images: [], videos: [] },
      },
      {
        author: users[2]._id,
        body: "Just deployed my first Node.js backend!",
        media: { images: [], videos: [] },
      },
    ];

    await Post.insertMany(posts);
    console.log("✅ Posts seeded");
  } catch (err) {
    console.error("❌ Error seeding posts:", err);
  }
}

module.exports = seedPosts;
