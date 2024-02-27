const { REST, Routes } = require('discord.js');
const client = require('../utils/discordClient.js');
const { readdirSync } = require('fs');
const path = require('path');
const catchAsync = require('../utils/catchAsync.js');
const internal = require('stream');

const dirPath = path.join(__dirname, '/systemCommands');
const files = readdirSync(dirPath);
const commands = [];

(() => {
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
  }
})();

const rest = new REST().setToken(process.env.BOT_TOKEN);

client.on(
  'ready',
  catchAsync(async () => {
    await rest.put(
      Routes.applicationGuildCommands(process.env.BOT_ID, process.env.GUILD),
      { body: commands }
    );
  })
);

client.on(
  'interactionCreate',
  catchAsync(async (interaction) => {
    if (interaction.isCommand()) {
      const command = files.find(
        (file) => file === interaction.commandName + '.js'
      );

      if (!command && !interaction.replied)
        return interaction.reply({
          ephemeral: true,
          content: `This command is not found.`,
        });

      const { execute, allowed } = require(path.join(dirPath, command));

      try {
        if (allowed) {
          const executer = await interaction.member.fetch();
          if (!executer.roles.cache.some((role) => allowed.includes(role.id)))
            return interaction.reply({
              ephemeral: true,
              content: 'You cant use this command',
            });
        }

        await execute(interaction);
      } catch (e) {
        if (interaction.deferred) {
          interaction.editReply({
            ephemeral: true,
            content: `Could not complete this: ${e.message}`,
          });
        } else {
          interaction.reply({
            ephemeral: true,
            content: `Could not complete this: ${e.message}`,
          });
        }
      }
    } else if (interaction.isModalSubmit()) {
      const command = files.find(
        (file) => file === interaction.customId + '.js'
      );

      const { modalHandler } = require(path.join(dirPath, command));

      try {
        await modalHandler(interaction);
      } catch (e) {
        console.log(e);
        interaction.editReply({
          ephemeral: true,
          content: `Could not complete this: ${e.message}`,
        });
      }
    }
  })
);
