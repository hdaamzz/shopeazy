const User = require('../../models/user/userCredentials');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();




const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email_address: email, is_block: false })


        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch && userData.is_valid == 1) {
                req.session.user_id = userData._id;


                res.status(200).json({ success: true });
            } else {
                res.json({ success: false, msg: "Email or password incorrect" });
            }
        } else {

            res.json({ success: false, msg: "Shopeazy blocked you" });

        }
    } catch (error) {
        console.log('Error verify signin', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const loadForgotPassword =async(req,res)=>{
    try {
       res.render('forgotpassword') 
    } catch (error) {
        
    }
}


const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email_address: email, is_block: false });

        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }

        // Generate a password reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

        // Save the reset token and expiry to the user document
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        // Send email with reset link
        const transporter = nodemailer.createTransport({
            // Configure your email service here
            service: 'gmail',
            auth: {
                user: process.env.SUPER_EMAIL,
                pass: process.env.SUPER_PASS
            }
        });

        const mailOptions = {
            to: user.email_address,
            from: process.env.SUPER_EMAIL,
            subject: 'Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                   Please click on the following link, or paste this into your browser to complete the process:\n\n
                   http://${req.headers.host}/reset-password?token=${resetToken}\n\n
                   If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, msg: "Reset password link sent to your email" });
    } catch (error) {
        console.log('Error in forgot password', error.message);
        res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
};

const loadResetPassword =async(req,res)=>{
    try {
        const token = req.query.token
       res.render('resetpassword',{token}) 
    } catch (error) {
        
    }
}


const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ success: false, msg: "Password reset token is invalid or has expired" });
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, msg: "Password has been reset" });
    } catch (error) {
        console.log('Error in reset password', error.message);
        res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
};









module.exports = {

    verifyLogin,
    forgotPassword,
    resetPassword,
    loadForgotPassword,
    loadResetPassword


};