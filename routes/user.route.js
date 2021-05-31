const express = require('express');
const controller = require('../controllers/user.controller');
const middleware = require('../middlewares/token.middleware');

const router = express.Router();

router.get('/', middleware.verifyToken, controller.index);

router.post('/signup', controller.signup);

router.post('/login', controller.login);

router.patch('/update', middleware.verifyToken, controller.update);

module.exports = router;