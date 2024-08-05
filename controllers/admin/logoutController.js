

const logout = async (req, res) => {
    try {
        delete req.session.admin_id;
        res.redirect('/admin?logout=Logout Successfully...');
    } catch (error) {
        console.error('Error Logout Admin:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}


module.exports = {
    logout
}