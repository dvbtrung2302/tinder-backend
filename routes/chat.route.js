const express = require('express');
const controller = require('../controllers/chat.controller');
const middleware = require('../middlewares/token.middleware');

const router = express.Router();

router.get('/', middleware.verifyToken, controller.index);
router.delete('/delete-all', middleware.verifyToken, controller.deleteAll);

module.exports = router;