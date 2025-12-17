const { HTTP_STATUS } = require('../../../utils/constants');
const { getAuthenticatedUser } = require('../../../helpers/userHelper');
const Cart = require('../../../models/user/cart');
const Address = require('../../../models/user/userAddress');
const PaymentType = require('../../../models/admin/paymentType');
const Offer = require('../../../models/admin/offers');
const Coupon = require('../../../models/admin/coupons');

const OFFER_TYPES = {
  PRODUCT: 'PRODUCT',
  CATEGORY: 'CATEGORY'
};

const OFFER_STATUS = {
  ACTIVE: 'active'
};

const calculateBestDiscount = (item, offers) => {
  let bestDiscount = 0;
  let hasDiscount = false;
  let appliedOffer = null;

  offers.forEach((offer) => {
    if (offer.type === OFFER_TYPES.PRODUCT) {
      offer.products.forEach((product) => {
        if (String(product._id) === String(item.product_id._id)) {
          if (offer.discount > bestDiscount) {
            bestDiscount = offer.discount;
            hasDiscount = true;
            appliedOffer = offer;
          }
        }
      });
    } else if (offer.type === OFFER_TYPES.CATEGORY) {
      const categoryMatch = offer.category.some(
        (category) => String(item.product_id.category) === String(category._id)
      );

      if (categoryMatch && offer.discount > bestDiscount) {
        bestDiscount = offer.discount;
        hasDiscount = true;
        appliedOffer = offer;
      }
    }
  });

  return { bestDiscount, hasDiscount, appliedOffer };
};

const loadCheckout = async (req, res) => {
  try {
    const userData = await getAuthenticatedUser(req);
    if (!userData) return res.redirect('/');

    const [coupons, cartData, offers, addressData, paymentTypes] = await Promise.all([
      Coupon.find({}),
      Cart.find({ user_id: userData._id }).populate('product_id'),
      Offer.find({ status: OFFER_STATUS.ACTIVE })
        .populate('products')
        .populate('category'),
      Address.find({ user_id: userData._id }),
      PaymentType.find({})
    ]);

    let subtotal = 0;

    const cartItemsWithDiscounts = cartData.map((item) => {
      const { bestDiscount, hasDiscount, appliedOffer } = calculateBestDiscount(
        item,
        offers
      );

      let discountedPrice = item.product_id.price;
      if (hasDiscount) {
        discountedPrice = item.product_id.price * (1 - bestDiscount / 100);
      }

      subtotal += discountedPrice * item.quantity;

      return {
        ...item.toObject(),
        discountedPrice,
        hasDiscount,
        appliedOffer
      };
    });

    res.render('checkout', {
      userData,
      addressData,
      cartData: cartItemsWithDiscounts,
      subtotal: subtotal.toFixed(2),
      paymentTypes,
      offers,
      coupons
    });
  } catch (error) {
    console.error('Error loading checkout:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).render('404', { message: 'Server error' });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, subtotal } = req.body;

    if (typeof subtotal !== 'number' || isNaN(subtotal) || subtotal < 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid subtotal'
      });
    }

    const coupon = await Coupon.findOne({
      couponId: { $regex: new RegExp(`^${couponCode}$`, 'i') }
    });

    if (!coupon) {
      return res.json({ success: false, message: 'Invalid coupon code' });
    }

    if (!coupon.is_active) {
      return res.json({ success: false, message: 'This coupon is no longer active' });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.json({ success: false, message: 'This coupon has expired' });
    }

    if (subtotal < coupon.min_purchase_amount) {
      return res.json({
        success: false,
        message: `Minimum purchase amount for this coupon is ₹${coupon.min_purchase_amount}`
      });
    }

    if (subtotal > coupon.max_amount) {
      return res.json({
        success: false,
        message: `Maximum purchase amount for this coupon is ₹${coupon.max_amount}`
      });
    }

    let discountAmount = (subtotal * coupon.discount) / 100;
    if (coupon.max_amount && discountAmount > coupon.max_amount) {
      discountAmount = coupon.max_amount;
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const newTotal = Math.round((subtotal - discountAmount) * 100) / 100;

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      discountAmount,
      discountPercent: coupon.discount,
      newTotal
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while applying the coupon'
    });
  }
};

const removeCoupon = async (req, res) => {
  try {
    const { subtotal } = req.body;

    res.json({
      success: true,
      message: 'Coupon removed successfully',
      newTotal: subtotal
    });
  } catch (error) {
    console.error('Error removing coupon:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while removing the coupon'
    });
  }
};

module.exports = {
  loadCheckout,
  applyCoupon,
  removeCoupon
};
