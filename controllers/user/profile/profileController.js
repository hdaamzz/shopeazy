const { HTTP_STATUS } = require('../../../utils/constants');
const User = require('../../../models/user/userCredentials');
const bcrypt = require('bcrypt');

const PASSWORD_MIN_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 10;

const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
};

const updateUserData = async (req, res) => {
  try {
    const { userName, currentPassword, newPassword } = req.body;
    const userId = req.session.user_id;

    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    if (typeof currentPassword !== 'string') {
      return res.json({ success: false, message: 'Current password must be a string' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: 'Current password is incorrect' });
    }

    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < PASSWORD_MIN_LENGTH) {
        return res.json({
          success: false,
          message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters`
        });
      }

      const hashedPassword = await hashPassword(newPassword);

      await User.findByIdAndUpdate(userId, {
        password: hashedPassword,
        user_name: userName
      });
    } else {
      await User.findByIdAndUpdate(userId, { user_name: userName });
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

module.exports = {
  updateUserData
};
