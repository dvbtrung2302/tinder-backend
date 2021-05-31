const express = require('express');
const controller = require('../controllers/promotion.controller');
const middleware = require('../middlewares/token.middleware');

const router = express.Router();

router.get('/', controller.index);

router.post('/create-promotion', middleware.verifyToken, controller.createPromotion);

router.get('/get-promotion', controller.getPromotion);

router.post('/apply-promotion', controller.applyPromotion);

router.patch('/update-promotion', middleware.verifyToken, controller.updatePromotion);

router.post('/delete-promotion', middleware.verifyToken, controller.deletePromotion);

module.exports = router;