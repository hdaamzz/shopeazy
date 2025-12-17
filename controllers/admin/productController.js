const Category = require('../../models/admin/categoryList');
const Products = require('../../models/admin/products');
const path = require('path');
const fs = require('fs');
const { HTTP_STATUS } = require('../../utils/constants');

// Constants
const PRODUCTS_PER_PAGE = 10;
const IMAGE_COUNT = 3;
const BASE64_IMAGE_PREFIX = 'data:image';


const loadProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * PRODUCTS_PER_PAGE;

        const [products, categories, totalProducts] = await Promise.all([
            Products.find({})
                .populate('category')
                .skip(skip)
                .limit(PRODUCTS_PER_PAGE),
            Category.find({}),
            Products.countDocuments({})
        ]);

        const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

        res.render('products', {
            product: products,
            categories,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error('Error loading products:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: 'An error occurred while loading products'
        });
    }
};

const loadAddProduct = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.render('addproduct', { category: categories });
    } catch (error) {
        console.error('Error loading add product page:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: 'An error occurred while loading add product page'
        });
    }
};

const addProduct = async (req, res) => {
    try {
        const images = req.files.map(file => file.filename);

        const productData = {
            product_name: req.body.productTitle,
            description: req.body.ProductDescription,
            images,
            category: req.body.categorySelection,
            is_listed: req.body.productOption,
            stock: parseInt(req.body.productCount),
            price: parseFloat(req.body.productPrice)
        };

        const newProduct = new Products(productData);
        await newProduct.save();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Product added successfully',
            redirectUrl: '/admin/products'
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: 'An error occurred while adding product'
        });
    }
};


const loadUpdateProduct = async (req, res) => {
    try {
        const { id } = req.query;

        const [product, categories] = await Promise.all([
            Products.findById(id).populate('category'),
            Category.find({})
        ]);

        if (!product) {
            return res.status(HTTP_STATUS.NOT_FOUND).redirect('/admin/products');
        }

        res.render('updateproduct', { productData: product, category: categories });
    } catch (error) {
        console.error('Error loading update product page:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).render('error500', {
            success: false,
            message: 'An error occurred while loading product'
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { hiddenid } = req.body;

        const existingProduct = await Products.findById(hiddenid);
        if (!existingProduct) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Product not found'
            });
        }

        const images = processProductImages(req.body, hiddenid);

        await Products.findByIdAndUpdate(hiddenid, {
            $set: {
                product_name: req.body.productTitle,
                description: req.body.ProductDescription,
                images,
                category: req.body.categorySelection,
                is_listed: req.body.productOption,
                stock: parseInt(req.body.productCount),
                price: parseFloat(req.body.productPrice)
            }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Product updated successfully',
            redirectUrl: '/admin/products'
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: 'An error occurred while updating product'
        });
    }
};

function processProductImages(requestBody, productId) {
    const images = [];

    for (let i = 1; i <= IMAGE_COUNT; i++) {
        const imageField = `productImage${i}`;
        const existingImageField = `existingImage${i}`;

        if (requestBody[imageField] && requestBody[imageField].startsWith(BASE64_IMAGE_PREFIX)) {
            const imageName = saveBase64Image(requestBody[imageField], productId, i);
            images.push(imageName);
        } else if (requestBody[existingImageField]) {
            images.push(requestBody[existingImageField]);
        }
    }

    return images;
}

function saveBase64Image(base64String, productId, index) {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const imageName = `cropped_product_${productId}_${index}.jpg`;
    const imagePath = path.join(__dirname, '../../uploads/', imageName);

    fs.writeFileSync(imagePath, buffer);
    return imageName;
}

module.exports = {
    loadProducts,
    loadAddProduct,
    addProduct,
    loadUpdateProduct,
    updateProduct
};
