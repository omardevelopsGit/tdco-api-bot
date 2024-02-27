const express = require('express');
const projectController = require('../controllers/projectController.js');
const authController = require('../controllers/authController.js');

const router = express.Router();

router
  .route('/')
  .post(
    authController.protect,
    authController.restrict('admin'),
    projectController.createProject
  )
  .get(authController.protect, projectController.getAllProject);

router
  .route('/categories/:catId')
  .get(authController.protect, projectController.getProject);

module.exports = router;
