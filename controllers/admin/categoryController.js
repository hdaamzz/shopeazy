

const Category = require('../../models/admin/categoryList');
const { DESCRIPTION_MAX_LENGTH, DESCRIPTION_MIN_LENGTH, HTTP_STATUS } = require('../../utils/constants');


const loadCategory = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.render('category', { category: categories });
  } catch (error) {
    console.error('Error loading categories:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while loading categories'
    });
  }
};

const addCategory = async (req, res) => {
  try {
    const { categoryTitle, description, categoryoption } = req.body;

    if (!categoryTitle || !description || !categoryoption) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (description.length < DESCRIPTION_MIN_LENGTH || description.length > DESCRIPTION_MAX_LENGTH) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Description must be between ${DESCRIPTION_MIN_LENGTH} and ${DESCRIPTION_MAX_LENGTH} characters`
      });
    }

    const normalizedTitle = categoryTitle.toUpperCase();
    const existingCategory = await Category.findOne({ category_name: normalizedTitle });

    if (existingCategory) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const newCategory = new Category({
      category_name: normalizedTitle,
      description,
      status: categoryoption === 'true'
    });

    await newCategory.save();

    res.json({
      success: true,
      message: 'Category added successfully',
      redirectUrl: '/admin/category'
    });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while adding category'
    });
  }
};

const toggleCategoryStatus = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.status = !category.status;
    await category.save();

    const message = category.status
      ? 'Category listed successfully'
      : 'Category unlisted successfully';

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error toggling category status:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while updating category status'
    });
  }
};

const loadUpdateCategory = async (req, res) => {
  try {
    const { id } = req.query;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).redirect('/admin/category');
    }

    res.render('updateCategory', { category });
  } catch (error) {
    console.error('Error loading update category page:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while loading category'
    });
  }
};


const updateCategory = async (req, res) => {
  try {
    const { hiddenid, productTitle, productOption, ProductDescription } = req.body;

    const normalizedTitle = productTitle.toUpperCase();
    const existingCategory = await Category.findOne({
      category_name: normalizedTitle,
      _id: { $ne: hiddenid }
    });

    if (existingCategory) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Category already exists',
        redirectUrl: '/admin/category'
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      hiddenid,
      {
        $set: {
          category_name: normalizedTitle,
          status: productOption,
          description: ProductDescription
        }
      },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Category not found',
        redirectUrl: '/admin/category'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Category updated successfully',
      redirectUrl: '/admin/category'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while updating category'
    });
  }
};

module.exports = {
  loadCategory,
  addCategory,
  toggleCategoryStatus,
  updateCategory,
  loadUpdateCategory
};
