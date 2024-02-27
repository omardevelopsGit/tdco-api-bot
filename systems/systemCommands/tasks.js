const processData = require('../../utils/processData.js');
const {
  SlashCommandBuilder,
  ChannelType,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require('discord.js');

const employeeRoleId = '1209179489582583848';
module.exports = {
  data: new SlashCommandBuilder()
    .setName('tasks')
    .setDescription(
      'The bot will direct message you and tell list you the tasks'
    )
    .addStringOption((option) =>
      option
        .setName('id')
        .setDescription('The ID of the task that you want to get')
    ),

  async execute(interaction) {
    await interaction.deferReply({
      ephemeral: true,
    });
    // Making headers
    const headers = new Headers();
    headers.append('Cookie', `jwt=${process.env.API_TOKEN}; Path=/; HttpOnly`);

    // Getting the options
    const category = await interaction.channel.parent;
    const user = await interaction.user;
    const taskId = interaction.options.getString('id');

    // Fetching the project
    const projectRes = await fetch(
      `${process.env.API}/api/v1/projects/categories/${category.id}`,
      {
        headers,
      }
    );

    const projectBody = await projectRes.json();

    if (projectBody.status !== 'success') throw new Error(projectBody.message);

    const projectData = projectBody.data.project;

    // Getting the user tasks
    const response = taskId
      ? await fetch(`${process.env.API}/api/v1/tasks/${taskId}`, { headers })
      : await fetch(
          `${process.env.API}/api/v1/tasks/${projectData._id}/tasks/user/${user.id}`,
          { headers }
        );

    const body = await response.json();
    if (body.status !== 'success') throw new Error(body.message);

    const tasks = taskId ? [body.data.data] : body.data.tasks;

    if (taskId && (tasks === [null] || tasks === [undefined]))
      return interaction.editReply({
        content: `No task found with this id`,
      });

    const dmChannel = await user.createDM(true);

    const contentsPromises = tasks.map(async (task) => {
      const user = await interaction.guild.members.fetch(task.commander);

      await dmChannel.send(`
        ### TASK ###
        # ${task.title} #
        \n
        ### ${user.displayName} created this task ###
        \n
        \n
        ${task.description}
        \n\n
        this task is ${task.status}
        \n
        ## Some helpful links ##
        ${task.embeds.join('\n')}
        \n\n\n
        ***Task ID: ${task._id.toString()}***
      `);
    });

    await Promise.all(contentsPromises);

    return interaction.editReply({
      content: "You've received your tasks for this project at direct messages",
    });
  },

  allowed: [employeeRoleId],
};
