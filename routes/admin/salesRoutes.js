const express = require('express');
const router = express.Router();
const salesController = require('../../controllers/admin/salesController');
const auth = require('../../middleware/adminAuth');

router.get('/salesreport', auth.isLogin, salesController.loadSales);
router.get('/salesreport/pdf', auth.isLogin, salesController.downloadPDF);
router.get('/salesreport/excel', auth.isLogin, salesController.downloadExcel);

module.exports = router;
