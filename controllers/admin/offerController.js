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
    const [offers, products] = await Promise.all([
      Offer.find({ type: OFFER_TYPES.PRODUCT }),
      Products.find({ is_listed: true })
    ]);

    res.render('offers', { products, offer: offers });
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
    const [offers, categories] = await Promise.all([
      Offer.find({ type: OFFER_TYPES.CATEGORY }),
      Category.find({ status: true })
    ]);

    res.render('cateoffers', { category: categories, offer: offers });
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

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Offer added successfully',
      redirectUrl: '/admin/offers'
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

    const updatedOffer = await Offer.findByIdAndUpdate(
      id,
      {
        $set: {
          title,
          description,
          discount,
          type,
          products,
          status
        }
      },
      { new: true }
    );

    if (!updatedOffer) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Offer updated successfully',
      redirectUrl: '/admin/offers'
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
