// backend/src/seedUsers.js
const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("./models/User");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function seedUsers() {
  try {
    console.log("👤 Seeding users...");
    await mongoose.connect(process.env.MONGODB_URI);

    await User.deleteMany();

    const hashedPassword = await bcrypt.hash("password123", 10);

    const users = await User.insertMany([
      {
        username: "Rahul",
        email: "rahul@example.com",
        password: hashedPassword, // ✅ FIXED SPELLING
        firstName: "Rahul",
        lastName: "S",
      },
      {
        username: "john",
        email: "john@example.com",
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
      },
      {
        username: "devuser",
        email: "dev@example.com",
        password: hashedPassword,
        firstName: "Dev",
        lastName: "User",
      },
    ]);

    console.log(`✅ Users seeded: ${users.length}`);
    return users;
  } catch (err) {
    console.error("❌ Error seeding users:", err);
    process.exit(1);
  }
}

module.exports = seedUsers;
