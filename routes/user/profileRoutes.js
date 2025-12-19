const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/user/profile/dashboardController');
const addressController = require('../../controllers/user/profile/addressController');
const profileController = require('../../controllers/user/profile/profileController');
const walletController = require('../../controllers/user/profile/walletController');
const auth = require('../../middleware/userAuth');

router.get('/dashboard', auth.isLogin, dashboardController.loadDashboard);

router.post('/addAddress', auth.isLogin, addressController.addUserAddress);
router.put('/updateAddress', auth.isLogin, addressController.updateUserAddress);
router.delete('/deleteAddress', auth.isLogin, addressController.deleteAddress);

router.put('/updateUser', auth.isLogin, profileController.updateUserData);

router.get('/wallet', auth.isLogin, walletController.loadWallet);
router.post('/wallet/withdraw', auth.isLogin, walletController.withdrawFunds);


module.exports = router;
