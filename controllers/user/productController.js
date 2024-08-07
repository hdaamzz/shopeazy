const User = require('../../models/userCredentials');
const Category = require('../../models/categoryList');
const Product = require('../../models/products');
const Cart = require('../../models/cart');
const Offer = require('../../models/offers');
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
            Product.find({ is_listed: true }).sort(sortOptions),
            Category.find({ status: true }),
            Offer.find({status:'active',type:'PRODUCT'}).populate('products')

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

        if (userData) {
            const category = req.query.id
            const cartItems = await Cart.find({ user_id: userData._id })
            const categoryData = await Category.findById(category);
            const productData = await Product.find({ is_listed: true, category: category });
            const offers = await Offer.find({status:'active',type:'PRODUCT'}).populate('products')



            res.render('productCategory', { categoryData, productData, userData, cartItems,offers })
        } else {
            const category = req.query.id
            const offers = await Offer.find({status:'active',type:'PRODUCT'}).populate('products')
            const categoryData = await Category.findById(category);
            const productData = await Product.find({ is_listed: true, category: category });
            res.render('productCategory', { categoryData, productData ,offers})
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

        if (userData) {
            const offers = await Offer.find({status:'active',type:'PRODUCT'}).populate('products')

            const productId = req.query.id
            const cartItems = await Cart.find({ user_id: userData._id })
            const productData = await Product.findById(productId).populate('category');
            const allProductData = await Product.find({ category: productData.category._id })
            res.render('product', { productData, allProductData, userData, cartItems ,offers})


        } else {
            const offers = await Offer.find({status:'active',type:'PRODUCT'}).populate('products')

            const productId = req.query.id
            const productData = await Product.findById(productId).populate('category');
            const allProductData = await Product.find({ category: productData.category._id })
            res.render('product', { productData, allProductData,offers })
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