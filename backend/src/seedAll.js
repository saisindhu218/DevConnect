// backend/src/seedAll.js
const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const seedUsers = require("./seedUsers");
const seedPosts = require("./seedPosts");
const seedBlogs = require("./seedBlogs");
const seedJobs = require("./seedJobs");

async function seedAll() {
  try {
    console.log("🔥 Connecting to DB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔥 Connected");

    console.log("\n=== 🌟 START SEEDING 🌟 ===");

    const users = await seedUsers();
    await seedPosts(users);
    await seedBlogs(users);
    await seedJobs(users);

    console.log("\n=== ✅ DONE SEEDING EVERYTHING 🎉 ===");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed All Failed:", err);
    process.exit(1);
  }
}

seedAll();
