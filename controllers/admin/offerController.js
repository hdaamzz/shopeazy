const Category = require('../../models/admin/categoryList');
const Products = require('../../models/admin/products');
const Offer = require('../../models/admin/offers');
const { HTTP_STATUS } = require('../../utils/constants');

const OFFER_TYPES = {
  PRODUCT: 'PRODUCT',
  CATEGORY: 'CATEGORY'
};

const loadProductOffers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * limit;

    const searchQuery = {
      type: OFFER_TYPES.PRODUCT,
      ...(search && {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      })
    };

    const sortObject = { [sortBy]: sortOrder };

    // Fetch offers with pagination - DON'T populate here
    const [offers, totalOffers, products] = await Promise.all([
      Offer.find(searchQuery)
        .sort(sortObject)
        .skip(skip)
        .limit(limit),
      Offer.countDocuments(searchQuery),
      Products.find({ is_listed: true })
    ]);

    const totalPages = Math.ceil(totalOffers / limit);

    res.render('offers', {
      products,
      offer: offers,
      currentPage: page,
      totalPages,
      totalOffers,
      limit,
      search,
      sortBy,
      sortOrder: req.query.sortOrder || 'desc'
    });
  } catch (error) {
    console.error('Error loading product offers:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while loading offers'
    });
  }
};

const loadCategoryOffers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * limit;

    const searchQuery = {
      type: OFFER_TYPES.CATEGORY,
      ...(search && {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      })
    };

    const sortObject = { [sortBy]: sortOrder };

    // Fetch offers with pagination - DON'T populate here
    const [offers, totalOffers, categories] = await Promise.all([
      Offer.find(searchQuery)
        .sort(sortObject)
        .skip(skip)
        .limit(limit),
      Offer.countDocuments(searchQuery),
      Category.find({ status: true })
    ]);

    const totalPages = Math.ceil(totalOffers / limit);

    res.render('cateoffers', {
      category: categories,
      offer: offers,
      currentPage: page,
      totalPages,
      totalOffers,
      limit,
      search,
      sortBy,
      sortOrder: req.query.sortOrder || 'desc'
    });
  } catch (error) {
    console.error('Error loading category offers:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while loading category offers'
    });
  }
};

const addOffer = async (req, res) => {
  try {
    const { title, description, discount, products, status, type } = req.body;

    const existingOffer = await Offer.findOne({ title, type });
    if (existingOffer) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'An offer with this title already exists'
      });
    }

    const offerData = {
      title,
      description,
      discount,
      type,
      status
    };

    if (type === OFFER_TYPES.PRODUCT) {
      offerData.products = products;
    } else if (type === OFFER_TYPES.CATEGORY) {
      offerData.category = products;
    }

    const newOffer = new Offer(offerData);
    await newOffer.save();

    const redirectUrl = type === OFFER_TYPES.PRODUCT 
      ? '/admin/offers' 
      : '/admin/offers/category';

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Offer added successfully',
      redirectUrl
    });
  } catch (error) {
    console.error('Error adding offer:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while adding offer'
    });
  }
};

const updateOffer = async (req, res) => {
  try {
    const { id, title, description, discount, products, status, type } = req.body;

    const existingOffer = await Offer.findOne({ 
      title, 
      type,
      _id: { $ne: id } 
    });
    
    if (existingOffer) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'An offer with this title already exists'
      });
    }

    const updateData = {
      title,
      description,
      discount,
      status
    };

    if (type === OFFER_TYPES.PRODUCT) {
      updateData.products = products;
    } else if (type === OFFER_TYPES.CATEGORY) {
      updateData.category = products;
    }

    const updatedOffer = await Offer.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedOffer) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Offer not found'
      });
    }

    const redirectUrl = type === OFFER_TYPES.PRODUCT 
      ? '/admin/offers' 
      : '/admin/offers/category';

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Offer updated successfully',
      redirectUrl
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while updating offer'
    });
  }
};

const deleteOffer = async (req, res) => {
  try {
    const { id } = req.body;

    const deletedOffer = await Offer.findByIdAndDelete(id);

    if (!deletedOffer) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while deleting offer'
    });
  }
};

module.exports = {
  loadProductOffers,
  loadCategoryOffers,
  addOffer,
  updateOffer,
  deleteOffer
};
