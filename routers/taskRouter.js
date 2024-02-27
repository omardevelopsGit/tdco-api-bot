const express = require('express');
const taskController = require('../controllers/tasksController.js');
const authController = require('../controllers/authController.js');

const router = express.Router();

router.use(authController.protect, authController.restrict('admin'));

router
  .route('/')
  .post(taskController.createTask)
  .get(taskController.getAllTasks);

router
  .route('/:project/tasks/user/:user')
  .get(
    authController.protect,
    authController.restrict('admin'),
    taskController.getUserProjectTasks
  );

router
  .route('/:id')
  .get(taskController.getTask)
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

module.exports = router;
