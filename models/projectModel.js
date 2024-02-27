const mongoose = require('mongoose');
const processData = require('../utils/processData.js');

// Schema
const projectRoles = processData.get('projectRoles');
const projectSchema = new mongoose.Schema({
  projectName: {
    ar: {
      type: String,
      required: [true, 'Please provide arabic project name'],
    },
    en: {
      type: String,
      required: [true, 'Please provide english project name'],
    },
  },
  members: [
    {
      user: {
        docId: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
        },
        discordId: {
          type: String,
          required: true,
        },
      },
      role: {
        type: String,
        enum: projectRoles,
        unique: true,
        required: true,
      },
    },
  ],
  discordCatId: {
    type: String,
    required: true,
    unique: true,
  },
  projectMemberRoleId: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  projectRooms: {
    generalChat: {
      type: String,
      required: true,
    },
    voiceCall: {
      type: String,
      required: true,
    },
    tasksChat: {
      type: String,
      required: true,
    },
    commandsChat: {
      type: String,
      required: true,
    },
    announcementChat: {
      type: String,
      required: true,
    },
  },
  projectRoles: [
    {
      name: {
        type: String,
        required: true,
      },
      id: {
        type: String,
        required: true,
      },
    },
  ],
});

// MiddleWares

// Model
const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
