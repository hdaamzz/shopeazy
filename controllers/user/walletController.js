const Wallet = require('../../models/user/userwallet')
const User = require('../../models/user/userCredentials');

const loadWallet = async(req,res)=>{
    try {

        const [walletData, userData] = await Promise.all([
            Wallet.find({ user_id: req.session.user_id }),
            User.find({ _id: req.session.user_id })
          ]);
          
       
        
        res.render('wallet',{wallet:walletData,user:userData})
    } catch (error) {
        
    }
}

module.exports = {
    loadWallet
};