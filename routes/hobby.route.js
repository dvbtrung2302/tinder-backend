const express = require('express');
const controller = require('../controllers/hobby.controller');
const middleware = require('../middlewares/token.middleware');

const router = express.Router();

router.get('/', middleware.verifyToken, controller.index);

router.post('/create', middleware.verifyToken, controller.create);

module.exports = router;