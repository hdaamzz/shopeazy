
const User = require('../models/userCredentials');
const bcrypt = require('bcrypt');
require('dotenv').config();
const nodemailer = require('nodemailer');
const passport = require('passport');
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
    service: 'gmail',
    auth: {
        user: process.env.SUPER_EMAIL,
        pass: process.env.SUPER_PASS
    }
});

const loadMain = async (req, res) => {
    try {
        res.render('userHome');
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
            password: spassword,
            is_valid: 1,
            is_block: 0
        };

        const email = req.body['register-email'];

        // Check if user already exists
        const existingUser = await User.findOne({ email_address: email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        const otp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
        req.session.otpStore = otp;
        req.session.userData = user;
        req.session.otpTime = Date.now();
        console.log(`${req.session.otpStore}`);
        const mailOptions = {
            from: process.env.SUPER_EMAIL,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. This OTP is valid for 1 minutes.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error.message);
                return res.status(500).send('Error sending email');
            } else {
                res.redirect(`/otpValidate?id=${email}`);
            }
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
};

const loadUserMain = async (req, res) => {
    try {
        let userData;
        if (req.user) {
            // If user is authenticated via Google
            userData = req.user;
        } else if (req.session.user_id) {
            // If user is authenticated via your existing method
            userData = await User.findById(req.session.user_id);
        }

        if (userData) {
            res.render('userHome', { user: userData });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
};

const loadOtp = async (req, res) => {
    try {
        const email = req.query.id;
        res.render("otpform", { email: email, message: "" });
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

            req.session.otpStore = null;
            req.session.userData = null;
            req.session.user_id = userData._id;
            res.redirect('/home');
        } else {
            const email = req.body['email'];
            res.render('otpform', { email: email, message: "Invalid OTP" });
        }
    } catch (error) {
        console.error('Error in verifyOtp:', error.message);
        res.status(500).send('Server error');
    }
};

const resendOtp = async (req, res) => {
    try {
        const email = req.body['email'];
        const otp = crypto.randomInt(100000, 999999).toString(); // Generate a new 6-digit OTP
        req.session.otpStore = otp;
        req.session.otpTime = Date.now();
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
                res.render('otpform', { email: email, message: "Resended successfully" });
            }
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
};

const userLogout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err);
        }
        delete req.session.user_id;
        res.redirect('/');
    });
};

const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

const googleAuthCallback = (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect('/'); // Redirect to login page if authentication fails
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.session.user_id = user._id; // Set the session user_id
            return res.redirect('/home'); // Redirect to home page on successful authentication
        });
    })(req, res, next);
};

const checkGoogleAuthStatus = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    } else if (req.session.user_id) {
        return next();
    }
    res.redirect('/');
};

const verifyLogin = async (req, res) => {
    try {
        const email = req.body['signin-email'];
        const password = req.body['signin-password'];
        const userData = await User.findOne({ email_address: email })


        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch && userData.is_valid == 1) {
                req.session.user_id = userData._id;

                res.redirect('/home');

            }
        } else {

            res.render('userHome', { message: "Email Or Password Is Incorret!" });

        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}

const checkMail = async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email_address: email });
        res.render('userHome', { alert: "This email is existing" });
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ error: 'Server error' });
    }
}







module.exports = {
    registerUser,
    loadMain,
    loadUserMain,
    userLogout,
    loadOtp,
    verifyOtp,
    resendOtp,
    googleAuth,
    googleAuthCallback,
    checkGoogleAuthStatus,
    verifyLogin,
    checkMail
};

