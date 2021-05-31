const express = require('express');
const controller = require('../controllers/admin.controller');
const middleware = require('../middlewares/token.middleware');

const router = express.Router();

router.post('/create', controller.create);

router.post('/login', controller.login);

router.get('/admin-get', middleware.verifyToken, controller.adminGet);

router.patch('/update', middleware.verifyToken, controller.updateProduct);

router.post('/add-product', middleware.verifyToken, controller.addProduct);

router.post('/delete-product', middleware.verifyToken, controller.deleteProduct);

module.exports = router;