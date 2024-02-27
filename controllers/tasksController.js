const Task = require('../models/taskModel.js');
const catchAsync = require('../utils/apiCatcher.js');
const AppError = require('../utils/appError.js');
const factory = require('./factory.js');

exports.createTask = factory.createOne(Task);

exports.getTask = factory.getOne(Task);

exports.getAllTasks = factory.getAll(Task);

exports.updateTask = factory.updateOne(Task);

exports.deleteTask = catchAsync(async (req, res, next) => {});

exports.getUserProjectTasks = catchAsync(async (req, res, next) => {
  // Fetch Tasks
  const tasks = await Task.find({ project: req.params.project });

  // Filter Tasks
  const filteredTasks = tasks.filter((task) =>
    task.officials.find((official) => official.discordId === req.params.user)
  );

  // Send Tasks
  res.status(200).json({
    status: 'success',
    data: {
      tasks: filteredTasks,
    },
  });
});
