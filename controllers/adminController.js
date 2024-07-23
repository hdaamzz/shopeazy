const Admin = require('../models/adminCredentials');
const User =require('../models/userCredentials');
const bcrypt = require('bcrypt');




const loadLogin =async(req,res)=>{
    try {
        res.render("loginform",{message:""})
    } catch (error) {
        console.log(error.message);
    }
}



const verifyAdmin = async (req, res) => {
    try {
        const email = req.body['email-username'];
        const password = req.body['password'];
        
        const adminData = await Admin.findOne({ email_address: email });
        if (!adminData) {
            return res.render('loginform', { message: "Email not found" });
        }
        
        const isPasswordValid = await bcrypt.compare(password, adminData.password);
        
        if (isPasswordValid) {
            console.log(`${adminData.admin_name} logged in successfully`);
            return res.redirect('admin/adminHome');
        } else {
            return res.render('loginform', { message: "Incorrect password" });
        }
    } catch (error) {
        console.error('Error in admin verification:', error);
        res.status(500).render('error');
    }
};
const loadDashboard=async(req,res)=>{
    try {
        res.render('dashboard')
    } catch (error) {
        console.error('Error in admin load dashboard:', error);
        res.status(500).render('error');
    }
}

const loadAllCustomers =async(req,res)=>{
    try {
        const userData = await User.find({ is_valid: 1 })
        res.render('allcustomer',{ users: userData })
        
    } catch (error) {
        console.error('Error in All customers load:', error);
        res.status(500).render('error');
    }
}

const blockUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.is_block = !user.is_block;
        await user.save();

        const message = user.is_block ? 'User blocked successfully' : 'User unblocked successfully';
        res.json({ success: true, message: message });

    } catch (error) {
        console.error('Error blocking/unblocking user:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}


module.exports ={
    loadLogin,
    verifyAdmin,
    loadDashboard,
    loadAllCustomers,
    blockUser
}