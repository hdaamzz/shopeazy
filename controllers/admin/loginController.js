const Admin = require('../../models/adminCredentials');
const bcrypt = require('bcrypt');


const loadLogin = async (req, res) => {
    try {
        let message = '';
        message = req.query.logout

        res.render("loginform", { message })
    } catch (error) {
        console.error('Error while load ,admin login page', error.message);

        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
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
            req.session.admin_id = adminData._id;
            console.log(`${adminData.admin_name} logged in successfully`);
            return res.redirect('admin/adminHome');
        } else {
            return res.render('loginform', { message: "Incorrect password" });
        }
    } catch (error) {
        console.error('Error in admin verification:', error.message);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};

const loadDashboard = async (req, res) => {
    try {
        res.render('dashboard')
    } catch (error) {
        console.error('Error in admin load dashboard:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}



module.exports = {
    loadLogin,
    verifyAdmin,
    loadDashboard

}