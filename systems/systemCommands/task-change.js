const { SlashCommandBuilder, ChannelType, Colors } = require('discord.js');
const processData = require('../../utils/processData.js');

const adminRoleId = '1207706612140343296';
const projectRoles = processData.get('projectRoles');

function snakeCaseToSentence(text) {
  const words = text.split('_');
  const capitalizedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1)
  );
  return capitalizedWords.join(' ');
}
module.exports = {
  data: new SlashCommandBuilder()
    .setName('task-change')
    .setDescription('Change task status')
    .addStringOption((option) =>
      option
        .setName('id')
        .setDescription('The desired task id')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('status')
        .setDescription('The new task state')
        .addChoices(
          { name: 'In progress', value: 'in-progress' },
          { name: 'Completed', value: 'completed' },
          { name: 'Issued', value: 'issued' }
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({
      ephemeral: true,
    });
    // Ready headers up
    const headers = new Headers();
    headers.append('Cookie', `jwt=${process.env.API_TOKEN}; Path=/; HttpOnly`);
    headers.append('Content-type', `application/json`);

    // Getting options
    const taskId = interaction.options.getString('id');
    const newState = interaction.options.getString('status');

    // Fetch task
    const taskGetRes = await fetch(
      `${process.env.API}/api/v1/tasks/${taskId}`,
      {
        method: 'GET',
        headers,
      }
    );

    const taskBody = await taskGetRes.json();

    if (taskBody.status !== 'success')
      return interaction.editReply({
        content: `Could not fetch the task: ${body.message}`,
      });

    const task = await taskBody.data.data;

    if (!task.officials.find((user) => user.discordId === interaction.user.id))
      return interaction.editReply({
        content: 'You are not one of the officials for this task!',
      });

    const taskRes = await fetch(`${process.env.API}/api/v1/tasks/${taskId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        status: newState,
      }),
    });

    const body = await taskRes.json();

    if (body.status !== 'success')
      return interaction.editReply({
        content: `Could not edit the task: ${body.message}`,
      });

    if (newState === 'completed') {
      const member = await interaction.guild.members.fetch(task.commander);
      const DMChannel = await member.createDM(true);
      await DMChannel.send(`
      # Task is completed #
      \n
      ***The Task: ${task.title}***
      ***ID: ${task._id}***
      \n
      status have been changed to completed by the official: ${
        interaction.guild.members.cache.get(
          task.officials.find((user) => user.discordId === interaction.user.id)
            ?.discordId
        )?.displayName
      }
      `);
    }

    return interaction.editReply({
      content: 'Successfully updated the task',
    });
  },

  allowed: null,
};
