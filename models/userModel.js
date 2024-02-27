const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return this.password === value;
      },
      message: 'Password confirm must be same as password',
    },
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
  },
  projects: [
    {
      project: {
        type: mongoose.Schema.ObjectId,
        ref: 'Project',
      },
      role: {
        type: String,
        required: true,
      },
    },
  ],
  email: {
    type: String,
    required: true,
    unique: true,
  },
  discordId: {
    type: String,
    required: true,
    unique: true,
  },
});

// MiddleWares
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Model
const User = mongoose.model('User', userSchema);

module.exports = User;
