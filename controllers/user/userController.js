
const User = require('../../models/userCredentials');
const Category = require('../../models/categoryList');
const Products = require('../../models/products');
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
    }, connectionTimeout: 60000
});

const loadMain = async (req, res) => {
    try {

        const product = await Products.find({}).populate('category')
        res.render('userHome', { product });
    } catch (error) {
        console.log(error.message);
    }
}

const registerUser = async (req, res) => {
    try {

        const { name, email, password } = req.body

        const existingUser = await User.findOne({ email_address: email });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'User already exists' });

        } else {

            const spassword = await securePassword(password);

            const user = {
                user_name: name,
                email_address: email,
                password: spassword,
                is_valid: 1,
                is_block: 0
            };

            const otp = crypto.randomInt(100000, 999999).toString();
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
                    console.log("Error details:", error);
                    res.status(500).json({ success: false, message: 'Error sending email', error: error.message });
                } else {

                    res.status(200).json({ success: true, redirectUrl: `/otpValidate?id=${email}` });

                }
            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const loadUserMain = async (req, res) => {
    try {
        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {

            userData = await User.findById(req.session.user_id);
        }

        if (userData) {
            const product = await Products.find({}).populate('category')
            res.render('userHome', { userData ,product });
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
        delete req.user;
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
            return res.redirect('/');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.session.user_id = user._id;
            return res.redirect('/home');
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
        const { email, password } = req.body;
        const userData = await User.findOne({ email_address: email })


        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch && userData.is_valid == 1) {
                req.session.user_id = userData._id;


                res.status(200).json({ success: true });
            } else {
                res.json({ success: false });
            }
        } else {

            res.json({ success: false });

        }
    } catch (error) {
        console.log('Error verify signin', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const loadProductCategory = async (req, res) => {
    try {
        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {

            userData = await User.findById(req.session.user_id);
        }

        if (userData) {
            const category = req.query.id
            const categoryData = await Category.findById(category);
            const productData = await Products.find({ category: category });


            res.render('productCategory', { categoryData, productData, userData })
        } else {
            const category = req.query.id
            const categoryData = await Category.findById(category);
            const productData = await Products.find({ category: category });
            res.render('productCategory', { categoryData, productData })
        }



    } catch (error) {
        console.log('Error Load Product Category', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const loadShowProduct = async (req, res) => {
    try {
        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {

            userData = await User.findById(req.session.user_id);
        }

        if (userData) {
            const productId = req.query.id
            const productData = await Products.findById(productId).populate('category');
            const allProductData = await Products.find({ category: productData.category._id })
            res.render('product', { productData, allProductData, userData })


        } else {
            const productId = req.query.id
            const productData = await Products.findById(productId).populate('category');
            const allProductData = await Products.find({ category: productData.category._id })
            res.render('product', { productData, allProductData })
        }
    } catch (error) {
        console.log('Error Load Product Category', error.message);
        res.status(500).send('Internal Server Error');
    }
}








module.exports = {
    registerUser,
    loadMain,
    loadUserMain,
    userLogout,
    loadOtp,
    verifyOtp,
    loadProductCategory,
    resendOtp,
    googleAuth,
    googleAuthCallback,
    checkGoogleAuthStatus,
    verifyLogin,
    loadShowProduct


};

