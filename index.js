// Handler
process.on('uncaughtException', (e) => {
  console.log('UNCAUGHT  EXCEPTION');
  console.log(e);
  process.exit();
});

process.on('unhandledRejection', (e) => {
  console.log('UNCAUGHT  REJECTION');
  console.log(e);
});

// Setting up process data
const processData = require('./utils/processData.js');

processData.set('projectRoles', [
  'project_manager',
  'construction_manager',
  'site_eng',
  'foreman',
  'arciticture_eng',
  'civil_eng',
  'quantity_serveyor',
  'document_control',
  'accountant',
  'store_keeper',
  'planner',
  'elictrical_eng',
  'mechanical_eng',
  'admin',
]);

// Requiring modules
require('dotenv').config();
const client = require('./utils/discordClient.js');
const commandsSystem = require('./systems/commandsSystem.js');
const joinToCreateSystem = require('./systems/joinToCreateSystem.js');
const mongoose = require('mongoose');
const express = require('express');
const server = require('./server.js');
const { ChannelType } = require('discord.js');

const app = express();

// DB
mongoose
  .connect(process.env.DB_URL)
  .then((connection) => {
    console.log('Successfully connected to the database');
    processData.set('db', connection);
  })
  .catch((e) => {
    console.log('Could not connect to the database');
    console.log(e.message);
    console.log(e.stack);
  });

// Handles
client.on('ready', async () => {
  console.log(`Bot is logged in as: ${client.user.tag} | ${client.user.id}`);
});

// Keeping the web service up
setInterval(async () => {
  try {
    await fetch(process.env.LIVE_API);
    console.log('Done a request on me!');
  } catch (e) {}
}, 60000 * 3);
