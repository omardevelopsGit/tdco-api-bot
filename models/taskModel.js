const mongoose = require('mongoose');

// Schema
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  embeds: [String],
  status: {
    type: String,
    enum: ['issued', 'in-progress', 'completed'],
    default: 'issued',
  },
  statusHistory: [
    {
      status: {
        type: String,
        required: true,
      },
      startedAt: Date,
    },
  ],
  commander: {
    type: String,
    required: true,
  },
  officials: [
    {
      userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      discordId: {
        type: String,
        required: true,
      },
    },
  ],
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
  },
});

// MiddleWares
taskSchema.pre('save', function (next) {
  if (this.isNew) {
    this.statusHistory = [{ status: this.status, startedAt: Date.now() }];
  }

  if (this.isModified('status') && !this.isNew) {
    this.statusHistory = [
      ...this.statusHistory,
      {
        status: this.status,
        startedAt: Date.now(),
      },
    ];
  }

  next();
});

// Model
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
