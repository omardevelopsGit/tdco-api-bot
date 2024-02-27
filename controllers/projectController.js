const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const Project = require('./../models/projectModel.js');
const catchAsync = require('./../utils/apiCatcher.js');
const AppError = require('./../utils/appError');

exports.createProject = catchAsync(async (req, res, next) => {
  const admins = await User.find({ role: 'admin' });
  const adminsMembers = admins.map((admin) => {
    return {
      user: {
        docId: admin._id,
        discordId: admin.discordId,
      },
      role: 'admin',
    };
  });
  const project = await Project.create({
    discordCatId: req.body.category,
    projectName: req.body.projectName,
    projectMemberRoleId: req.body.role, // The role id for a member of the project
    projectRooms: req.body.projectRooms,
    projectRoles: req.body.projectRoles,
    members: [...adminsMembers],
  });

  res.status(201).json({
    status: 'success',
    data: {
      project,
    },
  });
});

exports.getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findOne({ discordCatId: req.params.catId });

  if (!project) return next(new AppError('Could not find the project', 404));

  if (
    !project.members.find((member) => member.user.docId === req.user._id) &&
    req.user.role !== 'admin'
  )
    return next(new AppError('You cant access this project', 403));

  if (!project) return next(new AppError('Could not find this project', 404));

  res.status(200).json({
    status: 'success',
    data: {
      project,
    },
  });
});

exports.getAllProject = catchAsync(async (req, res, next) => {
  const projectsQuery = Project.find({});

  if (req.query.limit) {
    projectsQuery.limit(req.query.limit * 1);
  }

  const projects = await projectsQuery;
  const filteredProjects = projects.filter((project) => {
    return project.members.find((member) => {
      return member.user.docId.toString() === req.user._id.toString();
    });
  });

  res.status(200).json({
    status: 'success',
    data: {
      projects: filteredProjects,
    },
  });
});
