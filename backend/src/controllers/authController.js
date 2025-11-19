const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

/* -------------------------------------------------------------------------- */
/*                              Helper functions                              */
/* -------------------------------------------------------------------------- */
const createAccessToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  });

const createRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  });

/* -------------------------------------------------------------------------- */
/*                               Register User                                */
/* -------------------------------------------------------------------------- */
exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (existingUser)
      return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
    });

    const safeUser = await User.findById(newUser._id)
      .select("-password -refreshToken")
      .populate("posts", "body createdAt")
      .lean();

    return res
      .status(201)
      .json({ message: "Registration successful", user: safeUser });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

/* -------------------------------------------------------------------------- */
/*                                   Login                                   */
/* -------------------------------------------------------------------------- */
exports.login = async (req, res) => {
  try {
    const { usernameOrEmail, email, password } = req.body;
    const lookup = (usernameOrEmail || email || "").toString().trim();

    const user =
      (await User.findOne({ email: lookup.toLowerCase() })) ||
      (await User.findOne({ username: lookup }));

    if (!user)
      return res.status(401).json({ message: "Invalid credentials (user not found)" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ message: "Invalid credentials (wrong password)" });

    // Generate tokens
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // Send secure cookie
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Prepare safe user (no password or refresh token)
    const safeUser = await User.findById(user._id)
      .select("-password -refreshToken")
      .populate("posts", "body createdAt")
      .lean();

    // ✅ Attach tokens in response (client stores access token)
    res.json({
      user: safeUser,
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

/* -------------------------------------------------------------------------- */
/*                                 Refresh Token                              */
/* -------------------------------------------------------------------------- */
exports.refresh = async (req, res) => {
  const refreshToken = req.cookies?.jwt;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token" });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const dbUser = await User.findById(payload.id);

    if (!dbUser || dbUser.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Create a new access token
    const accessToken = createAccessToken(dbUser);

    const safeUser = await User.findById(dbUser._id)
      .select("-password -refreshToken")
      .populate("posts", "body createdAt")
      .lean();

    res.json({ accessToken, user: safeUser });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(403).json({ message: "Token invalid or expired" });
  }
};

/* -------------------------------------------------------------------------- */
/*                                   Logout                                   */
/* -------------------------------------------------------------------------- */
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.jwt;

    if (refreshToken) {
      try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(payload.id, { $unset: { refreshToken: 1 } });
      } catch (err) {
        // invalid token, ignore
      }
    }

    // Clear cookie
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};

/* -------------------------------------------------------------------------- */
/*                               Forgot Password                              */
/* -------------------------------------------------------------------------- */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // For security, don't reveal if email exists or not
    if (!user) {
      return res.json({ 
        message: "If an account with that email exists, a reset link has been sent" 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour
    
    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
    
    console.log(`🔐 Password reset link for ${user.email}: ${resetUrl}`);
    
    // In development, return the reset URL directly for testing
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement actual email sending service here
      // await sendPasswordResetEmail(user.email, resetUrl);
      
      res.json({ 
        message: "Password reset instructions have been sent to your email",
      });
    } else {
      // Development mode - return the reset link directly
      res.json({ 
        message: "Password reset link generated successfully",
        resetUrl: resetUrl,
        userEmail: user.email,
        instructions: "Use this link to reset your password:",
      });
    }

  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

/* -------------------------------------------------------------------------- */
/*                               Reset Password                               */
/* -------------------------------------------------------------------------- */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        message: "Reset token and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Find user by valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired reset token. Please request a new password reset." 
      });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log(`✅ Password reset successful for user: ${user.email}`);

    res.json({ 
      message: "Password reset successfully. You can now login with your new password." 
    });

  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};