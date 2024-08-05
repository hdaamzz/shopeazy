const Category = require('../../models/categoryList');


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

const updateCategory = async (req, res) => {
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



module.exports = {
    loadCategory,
    addCategory,
    listCategory,
    updateCategory,
    loadUpdateCategory,

}