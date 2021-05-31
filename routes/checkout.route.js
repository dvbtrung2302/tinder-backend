const express = require('express');
const controller = require('../controllers/checkout.controller');

const router = express.Router();

router.get('/', controller.index);

router.post('/', controller.postCheckout);
module.exports = router;