const User = require('../../models/user/userCredentials');
const Product = require('../../models/admin/products');

require('dotenv').config();




const searchResults = async (req, res) => {
    try {
        const { q: query, sort } = req.query;

        // Build the search criteria
        const searchCriteria = {};
        if (query) {
            searchCriteria.$or = [
                { product_name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { "category.category_name": { $regex: query, $options: 'i' } }
            ];
        }

        // Handle sorting
        let sortOptions = {};
        if (sort === 'name_asc') {
            sortOptions = { product_name: 1 };
        } else if (sort === 'name_desc') {
            sortOptions = { product_name: -1 };
        } else if (sort === 'price_asc') {
            sortOptions = { price: 1 };
        } else if (sort === 'price_desc') {
            sortOptions = { price: -1 };
        }

        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {
            userData = await User.findById(req.session.user_id);
        }

        if (userData) {
            const products = await Product.find(searchCriteria)
                .sort(sortOptions)
                .populate('category');

            res.render('search-results', { userData, products, query, sort });
        } else {
            const products = await Product.find(searchCriteria)
                .sort(sortOptions);

            res.render('search-results', { products, query, sort });
        }
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};

const shopFilter = async (req, res) => {
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

        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {
            userData = await User.findById(req.session.user_id);
        }

        const products = await Product.find().sort(sortOptions);

       
        res.render('user/shop', { userData, products, sort: sort || '' });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};










module.exports = {

    searchResults,
    shopFilter


};