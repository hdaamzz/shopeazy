const { HTTP_STATUS } = require('../../../utils/constants');
const { getAuthenticatedUser } = require('../../../helpers/userHelper');
const Orders = require('../../../models/user/userOrders');
const Cart = require('../../../models/user/cart');
const Address = require('../../../models/user/userAddress');

const loadDashboard = async (req, res) => {
  try {
    const userData = await getAuthenticatedUser(req);
    if (!userData) return res.redirect('/');

    const [orderData, cartItems, addressData] = await Promise.all([
      Orders.find({ user_id: userData._id })
        .populate('payment_type')
        .populate('items')
        .populate('items.product_id')
        .sort({ created_at: -1 }),
      Cart.find({ user_id: userData._id }),
      Address.find({ user_id: userData._id })
    ]);

    res.render('dashboard', { userData, addressData, cartItems, orderData });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Internal Server Error');
  }
};

module.exports = {
  loadDashboard
};
