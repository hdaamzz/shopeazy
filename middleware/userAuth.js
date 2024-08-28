const User = require('../models/user/userCredentials')


const isLogin = async (req, res, next) => {
    try {
        const user =await User.findById(req.session.user_id)
        if (req.session.user_id && user.is_block == 0) {

        } else {
            return res.redirect('/login')
        }
        return next();
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            const user =await User.findById(req.session.user_id)
            if(!user.is_block){
                return res.redirect('/home')
            }else{
                return next(); 
            }
            
        }else{
            return next();
        }
        
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    isLogin,
    isLogout
}