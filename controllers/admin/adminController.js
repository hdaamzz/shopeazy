const Admin = require('../../models/adminCredentials');
const User = require('../../models/userCredentials');
const Category = require('../../models/categoryList');
const Products = require('../../models/products');
const Orders = require('../../models/userOrders')
const bcrypt = require('bcrypt');




const loadLogin = async (req, res) => {
    try {
        let message = '';
        message = req.query.logout

        res.render("loginform", { message })
    } catch (error) {
        console.error('Error while load ,admin login page', error.message);

        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}



const verifyAdmin = async (req, res) => {
    try {
        const email = req.body['email-username'];
        const password = req.body['password'];

        const adminData = await Admin.findOne({ email_address: email });
        if (!adminData) {
            return res.render('loginform', { message: "Email not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, adminData.password);

        if (isPasswordValid) {
            req.session.admin_id = adminData._id;
            console.log(`${adminData.admin_name} logged in successfully`);
            return res.redirect('admin/adminHome');
        } else {
            return res.render('loginform', { message: "Incorrect password" });
        }
    } catch (error) {
        console.error('Error in admin verification:', error.message);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};
const loadDashboard = async (req, res) => {
    try {
        res.render('dashboard')
    } catch (error) {
        console.error('Error in admin load dashboard:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const loadAllCustomers = async (req, res) => {
    try {
        const userData = await User.find({ is_valid: 1 })
        res.render('allcustomer', { users: userData })

    } catch (error) {
        console.error('Error in All customers load:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const blockUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.is_block = !user.is_block;
        await user.save();

        const message = user.is_block ? 'User blocked successfully' : 'User unblocked successfully';
        res.json({ success: true, message: message });

    } catch (error) {
        console.error('Error blocking/unblocking user:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const loadCategory = async (req, res) => {
    try {
        const categoryData = await Category.find({})
        res.render('category', { category: categoryData })
    } catch (error) {
        console.error('Error load category:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const addCategory = async (req, res) => {
    try {
        const { categoryTitle, description, categoryoption } = req.body;

    
        if (!categoryTitle || !description || !categoryoption) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        if (description.length < 10 || description.length > 200) {
            return res.status(400).json({ success: false, message: 'Description must be between 10 and 200 characters' });
        }

        // Check if the category already exists
        const existingCategory = await Category.findOne({ category_name: categoryTitle });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }

        const category = {
            category_name: categoryTitle,
            description,
            status: categoryoption === 'true'
        };
        const categoryData = new Category(category);
        await categoryData.save();
        res.json({ success: true, message: 'Category added successfully' , redirectUrl:'/admin/category'});
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};

const listCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        category.status = !category.status;
        await category.save();

        const message = category.status ? 'Category listed successfully' : 'Category unlisted successfully';
        res.json({ success: true, message: message });

    } catch (error) {
        console.error('Error list/unlist :', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}
// const updateCategory = async (req, res) => {
//     try {
//         await Category.findByIdAndUpdate({ _id: req.body['hiddenId'] }, {
//             $set: {
//                 category_name: req.body['categoryTitle'],
//                 description: req.body['description'],
//                 status: req.body['categoryoption']
//             }
//         });
//         res.redirect('/admin/category')
//     } catch (error) {
//         console.error('Error Update Category:', error);
//         res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
//     }
// }

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

        // Handle image uploads
        for (let i = 1; i <= 3; i++) {
            const fieldName = `productImage${i}`;
            if (req.files && req.files[fieldName]) {
                images.push(req.files[fieldName][0].filename);
            } else if (req.body[`existingImage${i}`]) {
                images.push(req.body[`existingImage${i}`]);
            }
        }

        // Update product
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

const logout = async (req, res) => {
    try {
        delete req.session.admin_id;
        res.redirect('/admin?logout=Logout Successfully...');
    } catch (error) {
        console.error('Error Logout Admin:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const loadUpdateCategory = async (req, res) => {
    try {
        const id = req.query.id


        const category = await Category.findById(id);

        res.render('updateCategory',{category})
    } catch (error) {
        console.error('Error Logout Admin:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const UpdateCategory = async (req, res) => {
    try {
        const { hiddenid, productTitle, productOption, ProductDescription } = req.body;

        console.log(hiddenid, productTitle, productOption, ProductDescription);

        await Category.findByIdAndUpdate(hiddenid, {
            $set: {
                category_name: productTitle,
                status: productOption,
                description: ProductDescription
            }
        });
        
        res.status(200).json({ success: true, message: 'Category updated successfully', redirectUrl: '/admin/category' });
    } catch (error) {
        console.error('Error during category update:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};
const loadOrderList= async (req, res) => {
    try {
        const orders = await Orders.find({}).populate('user_id').populate('address_id').populate('items.product_id').populate('payment_type');;
        res.render('orders', { orders })
    } catch (error) {
        console.error('Error Load Produts:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}
const loadupdateStatus= async (req, res) => {
    try {
        const id = req.query.id


        const order = await Orders.findById(id).populate('user_id');
        res.render('editstatus', { order })
    } catch (error) {
        console.error('Error Load Produts:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}
const updateStatus = async (req, res) => {
    try {
        const { hiddenid, productOption} = req.body;

        await Orders.findByIdAndUpdate(hiddenid, {
            $set: {
                order_status: productOption
            }
        });
        
        res.status(200).json({ success: true, message: 'Order status updated successfully', redirectUrl: '/admin/orders' });
    } catch (error) {
        console.error('Error during category update:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { _id} = req.body;
       console.log(_id);
        await Orders.findByIdAndUpdate(_id, { 
            order_status: 'Cancelled'
        });

        res.json({ success: true ,message: "Order Cancelled Successfully"});
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel order' });
    }
};


module.exports = {
    loadLogin,
    verifyAdmin,
    loadDashboard,
    loadAllCustomers,
    blockUser,
    loadCategory,
    addCategory,
    listCategory,
    UpdateCategory,
    loadProducts,
    loadAddProduct,
    addProduct,
    loadUpdateProduct,
    updateProduct,
    logout,
    loadUpdateCategory,
    loadOrderList,
    loadupdateStatus,
    updateStatus,
    cancelOrder
    


}