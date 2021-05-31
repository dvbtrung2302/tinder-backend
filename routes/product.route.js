const express = require('express');
const controller = require('../controllers/product.controller');

const router = express.Router();

router.get('/', controller.index);

router.get('/product', controller.productDetail);

router.post('/', controller.addProduct);

module.exports = router;