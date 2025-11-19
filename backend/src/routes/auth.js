const express = require("express");
const router = express.Router();

// ✅ Import controllers - REMOVED forgotPasswordDev
const {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword); // ✅ Only this forgot password route
router.post("/reset-password", resetPassword);

module.exports = router;