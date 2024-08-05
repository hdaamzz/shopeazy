const Category = require('../../models/categoryList');
const Products = require('../../models/products');


const loadProducts = async (req, res) => {
    try {
        const product = await Products.find({}).populate('category');
        const categories = await Category.find({});
        res.render('products', { product: product, categories: categories })
    } catch (error) {
        console.error('Error Load Produts:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const loadAddProduct = async (req, res) => {
    try {
        const category = await Category.find({});
        res.render('addproduct', { category: category })
    } catch (error) {
        console.error('Error Load Add Produt:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const addProduct = async (req, res) => {
    try {
        const images = req.files.map(file => file.filename);
        
        const productData = {
            product_name: req.body['productTitle'],
            description: req.body['ProductDescription'],
            images: images,
            category: req.body['categorySelection'],
            is_listed: req.body['productOption'],
            stock: parseInt(req.body['productCount']),
            price: parseFloat(req.body['productPrice'])
        };

        const newProduct = new Products(productData);
        await newProduct.save();

        res.status(200).json({ success: true, message: 'Product added successfully', redirectUrl: '/admin/products' });
    } catch (error) {
        console.error('Error Adding Product:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};

const loadUpdateProduct = async (req, res) => {
    try {
        const id = req.query.id


        const productData = await Products.findById(id).populate('category')
        const category = await Category.find({})
        res.render('updateproduct', { productData, category })
    } catch (error) {
        console.error('Error Load Update Product:', error);
        res.status(500).render('error500', {
            success: false,
            message: 'An error occurred while processing your request'
        });
    }
}

const updateProduct = async (req, res) => {
    try {
        const hiddenId = req.body['hiddenid'];
        const existingProduct = await Products.findById(hiddenId);

        let images = [];

       
        for (let i = 1; i <= 3; i++) {
            const fieldName = `productImage${i}`;
            if (req.files && req.files[fieldName]) {
                images.push(req.files[fieldName][0].filename);
            } else if (req.body[`existingImage${i}`]) {
                images.push(req.body[`existingImage${i}`]);
            }
        }

   
        await Products.findByIdAndUpdate(hiddenId, {
            $set: {
                product_name: req.body['productTitle'],
                description: req.body['ProductDescription'],
                images: images,
                category: req.body['categorySelection'],
                is_listed: req.body['productOption'],
                stock: parseInt(req.body['productCount']),
                price: parseFloat(req.body['productPrice'])
            }
        });

        res.status(200).json({ success: true, message: 'Product updated successfully', redirectUrl: '/admin/products' });
    } catch (error) {
        console.error('Error Updating Product:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};


module.exports = {
    loadProducts,
    loadAddProduct,
    addProduct,
    loadUpdateProduct,
    updateProduct,
}