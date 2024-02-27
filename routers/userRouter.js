const express = require('express');
const authController = require('../controllers/authController.js');

const router = express.Router();

router.route('/login').post(authController.login);
router
  .route('/signup')
  .post(
    authController.protect,
    authController.restrict('admin'),
    authController.firstSignup
  )
  .put(authController.finalSignup);

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrict('admin'),
    authController.getUser
  );
router.route('/me').get(authController.protect, authController.getMe);

router
  .route('/:userId/projects/:projectId')
  .post(
    authController.protect,
    authController.restrict('admin'),
    authController.addProjectToUser
  );

module.exports = router;
