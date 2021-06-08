const express = require('express');
const controller = require('../controllers/user.controller');
const middleware = require('../middlewares/token.middleware');

const router = express.Router();

router.get('/', middleware.verifyToken, controller.index);

router.post('/signup', controller.signup);

router.post('/login', controller.login);

router.put('/update', middleware.verifyToken, controller.update);

router.post('/upload-avatar', middleware.verifyToken, controller.uploadAvatar)

router.post('/upload-photos', middleware.verifyToken, controller.uploadPhoto);

module.exports = router;