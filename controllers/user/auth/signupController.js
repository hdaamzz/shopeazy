const { HTTP_STATUS, VALID_USER } = require('../../../utils/constants');
const User = require('../../../models/user/userCredentials');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const passport = require('passport');
const crypto = require('crypto');
require('dotenv').config();

const securePassword = async (password) => bcrypt.hash(password, 10);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SUPER_EMAIL,
    pass: process.env.SUPER_PASS
  },
  connectionTimeout: 60000
});

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email_address: email });
    if (existingUser) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await securePassword(password);

    const user = {
      user_name: name,
      email_address: email,
      password: hashedPassword,
      is_valid: VALID_USER,
      is_block: 0
    };

    const otp = crypto.randomInt(100000, 999999).toString();
    req.session.otpStore = otp;
    req.session.userData = user;
    req.session.otpTime = Date.now();

    const mailOptions = {
      from: process.env.SUPER_EMAIL,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. This OTP is valid for 1 minutes.`
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('Error details:', error);
        return res
          .status(HTTP_STATUS.SERVER_ERROR)
          .json({ success: false, message: 'Error sending email', error: error.message });
      }

      res
        .status(HTTP_STATUS.OK)
        .json({ success: true, redirectUrl: `/otpValidate?id=${email}` });
    });
  } catch (error) {
    console.error(error.message);
    res
      .status(HTTP_STATUS.SERVER_ERROR)
      .json({ success: false, message: 'Server error' });
  }
};

const loadOtp = async (req, res) => {
  try {
    const email = req.query.id;
    res.render('otpform', { email, message: '' });
  } catch (error) {
    console.error(error.message);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Server error');
  }
};

const verifyOtp = async (req, res) => {
  try {
    const otp = req.body.otp;
    const filterOtp = otp.slice(0, 6);

    if (req.session.otpStore === filterOtp) {
      const userData = new User(req.session.userData);
      await userData.save();

      req.session.otpStore = null;
      req.session.userData = null;
      req.session.user_id = userData._id;
      return res.redirect('/home');
    }

    const email = req.body.email;
    res.render('otpform', { email, message: 'Invalid OTP' });
  } catch (error) {
    console.error('Error in verifyOtp:', error.message);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Server error');
  }
};

const resendOtp = async (req, res) => {
  try {
    const email = req.body.email;
    const otp = crypto.randomInt(100000, 999999).toString();
    req.session.otpStore = otp;
    req.session.otpTime = Date.now();

    const mailOptions = {
      from: process.env.SUPER_EMAIL,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. This OTP is valid for 2 minutes.`
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error(error.message);
        return res.status(HTTP_STATUS.SERVER_ERROR).send('Error sending email');
      }
      res.render('otpform', { email, message: 'Resended successfully' });
    });
  } catch (error) {
    console.error(error.message);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Server error');
  }
};

const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

const googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', (err, user) => {
    if (err) return next(err);
    if (!user) return res.redirect('/');

    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      req.session.user_id = user._id;
      return res.redirect('/home');
    });
  })(req, res, next);
};

const checkGoogleAuthStatus = (req, res, next) => {
  if (req.isAuthenticated() || req.session.user_id) return next();
  res.redirect('/');
};

module.exports = {
  registerUser,
  loadOtp,
  verifyOtp,
  resendOtp,
  googleAuth,
  googleAuthCallback,
  checkGoogleAuthStatus
};
