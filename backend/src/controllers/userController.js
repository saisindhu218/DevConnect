// backend/src/controllers/userController.js
const User = require('../models/User');

/**
 * Check username availability
 * GET /api/users/check-username?username=foo
 */
exports.checkUsername = async (req, res) => {
  try {
    const username = (req.query.username || '').toString().trim();
    if (!username) return res.status(400).json({ message: 'username query required' });

    const exists = await User.exists({ username });
    return res.json({ available: !exists });
  } catch (err) {
    console.error('checkUsername error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Check email availability
 * GET /api/users/check-email?email=a@b.com
 */
exports.checkEmail = async (req, res) => {
  try {
    const email = (req.query.email || '').toString().trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'email query required' });

    const exists = await User.exists({ email });
    return res.json({ available: !exists });
  } catch (err) {
    console.error('checkEmail error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
