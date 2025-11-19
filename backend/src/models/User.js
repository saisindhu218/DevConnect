const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema({
  title: String,
  company: String,
  years: String,
});

const educationSchema = new mongoose.Schema({
  school: String,
  degree: String,
  years: String,
});

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: String,
    lastName: String,
    bio: String,
    location: String,
    skills: [String],
    experience: [experienceSchema],
    education: [educationSchema],

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // IMPORTANT: track posts related to user
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

    refreshToken: String,
    
    // ✅ ADDED: Password reset fields
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);