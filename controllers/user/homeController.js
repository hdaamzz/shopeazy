const User = require('../../models/userCredentials');
const Category = require('../../models/categoryList');
const Product = require('../../models/products');
const Cart = require('../../models/cart');
const Offer = require('../../models/offers');
require('dotenv').config();



const loadMain = async (req, res) => {
    try {
        const category = await Category.find({ status: true });
        const product = await Product.find({ is_listed: true }).sort({ added_date: -1 }).populate('category');
        const offers = await Offer.find({status:'active',type:'PRODUCT'}).populate('products')
        res.render('userHome', { product, category ,offers});
    } catch (error) {
        console.log(error.message);
    }
}

const loadUserMain = async (req, res) => {
    try {
        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {

            userData = await User.findById(req.session.user_id);
        }

        if (userData) {
            const cartItems = await Cart.find({ user_id: userData._id })
            const category = await Category.find({ status: true });
            const product = await Product.find({ is_listed: true }).sort({ added_date: -1 }).populate('category');
            const offers = await Offer.find({type:'PRODUCT'}).populate('products')
            console.log(offers);
            
            res.render('userHome', { userData, product, cartItems, category ,offers});
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
};
const checkGoogleAuthStatus = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    } else if (req.session.user_id) {
        return next();
    }
    res.redirect('/');
};

module.exports = {
    loadMain,
    loadUserMain,
    checkGoogleAuthStatus
};