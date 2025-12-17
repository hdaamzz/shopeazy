const { HTTP_STATUS } = require('../../utils/constants');
const Admin = require('../../models/admin/adminCredentials');
const bcrypt = require('bcrypt');

const loadLogin = async (req, res) => {
  try {
    const message = req.query.logout || '';
    res.render('loginform', { message });
  } catch (error) {
    console.error('Error loading admin login page:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while loading login page'
    });
  }
};

const verifyAdmin = async (req, res) => {
  try {
    const email = req.body['email-username'];
    const password = req.body['password'];

    const admin = await Admin.findOne({ email_address: email });

    if (!admin) {
      return res.render('loginform', { message: 'Email not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.render('loginform', { message: 'Incorrect password' });
    }

    req.session.admin_id = admin._id;
    return res.redirect('admin/adminHome');
  } catch (error) {
    console.error('Error in admin verification:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
};

const logout = async (req, res) => {
  try {
    delete req.session.admin_id;
    res.redirect('/admin?logout=Logout Successfully...');
  } catch (error) {
    console.error('Error logging out admin:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred during logout'
    });
  }
};

module.exports = {
  loadLogin,
  verifyAdmin,
  logout
};
