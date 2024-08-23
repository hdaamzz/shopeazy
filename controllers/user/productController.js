const User = require('../../models/user/userCredentials');
const Category = require('../../models/admin/categoryList');
const Product = require('../../models/admin/products');
const Cart = require('../../models/user/cart');
const Offer = require('../../models/admin/offers');
require('dotenv').config();



const loadShop = async (req, res) => {
    try {
        const { sort } = req.query; 

        let sortOptions = {};
        switch (sort) {
            case 'name_asc':
                sortOptions = { product_name: 1 };
                break;
            case 'name_desc':
                sortOptions = { product_name: -1 };
                break;
            case 'price_asc':
                sortOptions = { price: 1 };
                break;
            case 'price_desc':
                sortOptions = { price: -1 };
                break;
            default:
                sortOptions = { product_name: 1 }; 
        }

        const [allProducts, category,offers] = await Promise.all([
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
            Category.find({ status: true }),
            Offer.find({status:'active'}).populate('products').populate('category')

        ]);

        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {
            userData = await User.findById(req.session.user_id);
        }

        res.render('shop', { product: allProducts, category, userData ,offers, sort: sort || '' });

    } catch (error) {
        console.error('Error loading shop:', error);
        res.status(500).render('error', { message: 'Failed to load shop' });
    }
};

const loadProductCategory = async (req, res) => {
    try {
        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {
            userData = await User.findById(req.session.user_id);
        }

        const category = req.query.id;
        const [categoryData, productData, offers] = await Promise.all([
            Category.findById(category),
            Product.find({ is_listed: true, category: category }).populate('category'),
            Offer.find({
              status: 'active',
              $or: [{ type: 'PRODUCT' }, { type: 'CATEGORY' }]
            }).populate('products').populate('category')
          ]);
          

        if (userData) {
            const cartItems = await Cart.find({ user_id: userData._id });
            res.render('productCategory', { categoryData, productData, userData, cartItems, offers });
        } else {
            res.render('productCategory', { categoryData, productData, offers });
        }

    } catch (error) {
        console.log('Error Load Product Category', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const loadShowProduct = async (req, res) => {
    try {
        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {
            userData = await User.findById(req.session.user_id);
        }

        const productId = req.query.id;
        const productData = await Product.findById(productId).populate('category');
        const allProductData = await Product.find({ category: productData.category._id });

        const offers = await Offer.find({
            status: 'active',
            $or: [
                { type: 'PRODUCT' },
                { type: 'CATEGORY', category: productData.category._id }
            ]
        }).populate('products').populate('category');

        if (userData) {
            const cartItems = await Cart.find({ user_id: userData._id });
            res.render('product', { productData, allProductData, userData, cartItems, offers });
        } else {
            res.render('product', { productData, allProductData, offers });
        }
    } catch (error) {
        console.log('Error Load Product Category', error.message);
        res.status(500).send('Internal Server Error');
    }
}












module.exports = {
    loadShowProduct,
    loadShop,
    loadProductCategory
};