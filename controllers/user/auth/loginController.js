const { HTTP_STATUS } = require('../../../utils/constants');
const User = require('../../../models/user/userCredentials');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

const loadLogin = async (req, res) => {
  try {
    res.render('login');
  } catch (error) {
    console.error(error.message);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Server error');
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email_address: email });

    if (!userData) {
      return res.json({ success: false, msg: 'Email or password incorrect' });
    }else if (userData.is_block==true){
      return res.json({ success: false, msg: 'Shopeazy blocked you' });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (passwordMatch && userData.is_valid === true) {
      req.session.user_id = userData._id;
      return res.status(HTTP_STATUS.OK).json({ success: true });
    }

    res.json({ success: false, msg: 'Email or password incorrect' });
  } catch (error) {
    console.error('Error verify signin', error.message);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Internal Server Error');
  }
};

const loadForgotPassword = async (req, res) => {
  try {
    res.render('forgotpassword');
  } catch (error) {
    console.error(error.message);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Server error');
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email_address: email, is_block: false });

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, msg: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000;

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SUPER_EMAIL,
        pass: process.env.SUPER_PASS
      }
    });

    const mailOptions = {
      from: process.env.SUPER_EMAIL,
      to: email,
      subject: 'Password Reset',
      text:
        `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
        `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
        `https://${req.headers.host}/auth/password/reset?token=${resetToken}\n\n` +
        `If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    transporter.sendMail(mailOptions,(error)=>{
      if (error) {
        console.error('Error details:', error);
        return res
          .status(HTTP_STATUS.SERVER_ERROR)
          .json({ success: false, message: 'Error sending email', error: error.message });
      }
      res
      .status(HTTP_STATUS.OK)
      .json({ success: true, msg: 'Reset password link sent to your email' });
    });
  } catch (error) {
    console.error('Error in forgot password', error.message);
    res
      .status(HTTP_STATUS.SERVER_ERROR)
      .json({ success: false, msg: 'Internal Server Error' });
  }
};

const loadResetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    res.render('resetpassword', { token });
  } catch (error) {
    console.error(error.message);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Server error');
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ success: false, msg: 'Password reset token is invalid or has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res
      .status(HTTP_STATUS.OK)
      .json({ success: true, msg: 'Password has been reset' });
  } catch (error) {
    console.error('Error in reset password', error.message);
    res
      .status(HTTP_STATUS.SERVER_ERROR)
      .json({ success: false, msg: 'Internal Server Error' });
  }
};

module.exports = {
  verifyLogin,
  forgotPassword,
  resetPassword,
  loadForgotPassword,
  loadResetPassword,
  loadLogin
};
