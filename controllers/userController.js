
const User = require('../models/userCredentials');
const bcrypt = require('bcrypt');
require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
        user: process.env.SUPER_EMAIL, // Your email
        pass: process.env.SUPER_PASS // Your email password
    }
});

const loadMain = async (req, res) => {
    try {
        res.render('main');
    } catch (error) {
        console.log(error.message);
    }
}

const registerUser = async (req, res) => {
    try {
        const spassword = await securePassword(req.body['register-password']);

        const user = {
            user_name: req.body['register-name'],
            email_address: req.body['register-email'],
            phone_number: req.body['register-phone'],
            password: spassword,
            is_valid: 1,
            is_block: 0
        };

        const email = req.body['register-email'];
        const otp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
        req.session.otpStore = otp;
        req.session.userData = user;
        console.log(`${req.session.otpStore}`);
        const mailOptions = {
            from: process.env.SUPER_EMAIL,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. This OTP is valid for 2 minutes.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error.message);
                return res.status(500).send('Error sending email');
            } else {
                res.redirect(`/otpValidate`);
            }
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
};

const loadUserMain = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.user_id });
        res.render('main', { user: userData });
    } catch (error) {
        console.log(error.message);
    }
}

const loadOtp = async (req, res) => {
    try {
        res.render("otpform",{message:""});
    } catch (error) {
        console.log(error.message);
    }
}

const verifyOtp = async (req, res) => {
    try {
        const otp = req.body['otp'];
        const filterOtp = otp.slice(0, 6);

        if (req.session.otpStore === filterOtp) {
            const userData = new User(req.session.userData);
            await userData.save();

            req.session.otpStore = null; // Remove OTP after successful verification
            req.session.userData = null; // Remove userData from session
            req.session.user_id = userData._id;
            res.redirect('/home');
        } else {
            res.render('otpform',{message:"Invalid OTP"})
        }
    } catch (error) {
        console.error('Error in verifyOtp:', error.message);
        res.status(500).send('Server error');
    }
};

const userLogout = async (req, res) => {
    try {
        delete req.session.user_id;
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    registerUser,
    loadMain,
    loadUserMain,
    userLogout,
    loadOtp,
    verifyOtp
};
