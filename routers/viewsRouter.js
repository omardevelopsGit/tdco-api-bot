const express = require('express');
const viewsController = require('../controllers/viewsController.js');
const authController = require('../controllers/authController.js');

const router = express.Router();

router.get('/me', authController.protect, viewsController.getMe);

router.get('/signup', viewsController.getSignup);
router.get('/login', viewsController.getLogin);

module.exports = router;
