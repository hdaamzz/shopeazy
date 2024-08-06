const Wallet = require('../../models/userwallet')
const User = require('../../models/userCredentials');

const loadWallet = async(req,res)=>{
    try {

        const walletData= await Wallet.find({user_id:req.session.user_id})
        const userData = await User.find({_id:req.session.user_id})
       
        
        res.render('wallet',{wallet:walletData,user:userData})
    } catch (error) {
        
    }
}

module.exports = {
    loadWallet
};