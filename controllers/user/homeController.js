const User = require('../../models/user/userCredentials');
const Category = require('../../models/admin/categoryList');
const Product = require('../../models/admin/products');
const Cart = require('../../models/user/cart');
const Offer = require('../../models/admin/offers');
require('dotenv').config();



const loadMain = async (req, res) => {
    try {
        const [category, product, offers] = await Promise.all([
            Category.find({ status: true }),
            Product.aggregate([
                {
                  $match: { is_listed: true }
                },
                {
                  $lookup: {
                    from: 'categories', 
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                  }
                },
                {
                  $unwind: '$category'
                },
                {
                  $match: { 'category.status': true }
                },
                {
                  $sort: { added_date: -1 }
                }
              ]),
            Offer.find({ status: 'active' }).populate('products').populate('category')
          ]);
          
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
            const [cartItems, category, product, offers] = await Promise.all([
                Cart.find({ user_id: userData._id }),
                Category.find({ status: true }),
                Product.aggregate([
                    {
                      $match: { is_listed: true }
                    },
                    {
                      $lookup: {
                        from: 'categories', 
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                      }
                    },
                    {
                      $unwind: '$category'
                    },
                    {
                      $match: { 'category.status': true }
                    },
                    {
                      $sort: { added_date: -1 }
                    }
                  ]),
                Offer.find({ status: 'active' }).populate('products').populate('category')
              ]);
              
           
            
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