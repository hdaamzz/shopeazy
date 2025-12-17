const isLogin = async (req, res, next) => {
    try {
        if (!req.session.admin_id) {
            return res.redirect('/admin');
        }
        next();
    } catch (error) {
        console.error('Error in isLogin middleware:', error);
        res.redirect('/admin');
    }
};

const isLogout = async (req, res, next) => {
    try {
        if (req.session.admin_id) {
            return res.redirect('/admin/adminHome');
        }
        next();
    } catch (error) {
        console.error('Error in isLogout middleware:', error);
        next();
    }
};

module.exports = {
    isLogin,
    isLogout
};
