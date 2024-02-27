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

const tasksRoomId = '1208800206662017044';
module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-task')
    .setDescription('To create a task in a project'),

  async execute(interaction) {
    // Modal
    const modal = new ModalBuilder()
      .setCustomId('create-task')
      .setTitle('Create A New Task');

    // Inputs
    const titleInput = new TextInputBuilder()
      .setLabel('Task Title')
      .setRequired(true)
      .setStyle(TextInputStyle.Short)
      .setCustomId('title');

    const descriptionInput = new TextInputBuilder()
      .setLabel('Task Description')
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph)
      .setCustomId('description');

    const embedsInput = new TextInputBuilder()
      .setLabel('Task Embeds')
      .setStyle(TextInputStyle.Paragraph)
      .setCustomId('links');

    const assignToInput = new TextInputBuilder()
      .setLabel('Who must do this?')
      .setRequired(true)
      .setStyle(TextInputStyle.Short)
      .setCustomId('assigned-to');

    // Action Rows
    const titleActionRow = new ActionRowBuilder().addComponents(titleInput);
    const descriptionActionRow = new ActionRowBuilder().addComponents(
      descriptionInput
    );
    const embedsActionRow = new ActionRowBuilder().addComponents(embedsInput);
    const assignToActionRow = new ActionRowBuilder().addComponents(
      assignToInput
    );

    modal.addComponents(
      titleActionRow,
      descriptionActionRow,
      embedsActionRow,
      assignToActionRow
    );
    await interaction.showModal(modal);
  },

  async modalHandler(interaction) {
    const headers = new Headers();
    headers.append('Cookie', `jwt=${process.env.API_TOKEN}; Path=/; HttpOnly`);

    await interaction.deferReply({ ephemeral: true });

    // Getting data from the modal
    const taskTitle = interaction.fields.getTextInputValue('title');
    const taskDescription = interaction.fields.getTextInputValue('description');
    const taskEmbeds = interaction.fields.getTextInputValue('links');
    const taskOfficial = interaction.fields
      .getTextInputValue('assigned-to')
      .trim();
    const embeds = taskEmbeds?.split('\n');

    // Getting the user
    let userData;
    try {
      const userResponse = await fetch(
        `${process.env.API}/api/v1/users/${taskOfficial}?id_type=discord`,
        {
          method: 'GET',
          headers,
        }
      );

      const userBody = await userResponse.json();

      if (userBody.status !== 'success') throw new Error('Error');

      userData = userBody.data.user;
    } catch (e) {
      return interaction.editReply({
        ephemeral: true,
        content: `Couldnt create the task (fetching user): ${e.message}`,
      });
    }

    // Getting the project data
    const projectResponse = await fetch(
      `${process.env.API}/api/v1/projects/categories/${interaction.channel.parent.id}/`,
      { headers }
    );
    const projectBody = await projectResponse.json();

    if (projectBody.status !== 'success') {
      return interaction.editReply({
        ephemeral: true,
        content: `Failed to fetch project details: ${projectBody.message}`,
      });
    }

    const project = projectBody.data.project;

    headers.append('Content-type', `application/json`);
    const response = await fetch(`${process.env.API}/api/v1/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: taskTitle,
        description: taskDescription,
        embeds,
        officials: [
          {
            userId: userData._id,
            discordId: taskOfficial,
          },
        ],
        commander: interaction.user.id,
        project: project._id,
      }),
    });

    const body = await response.json();

    if (body.status !== 'success') throw new Error(body.message);
    const taskData = body.data.data;

    const tasksRoom = await interaction.guild.channels.fetch(
      project.projectRooms.tasksChat
    );

    const announceContentEmbedsList = new EmbedBuilder().addFields();
    const taskAnnounceContent = `
          ### New Task is Created ###
          \n
          # ${taskTitle} #
          \n\n
          ${taskDescription}
          \n
          ${
            taskEmbeds
              ? `
            Useful links that can be used:\n
            ${embeds.join('\n\t')}
          `
              : ''
          }
          \n\n\n
          <@${
            interaction.user.id
          }> had made this task, and have assigned it to <@${taskOfficial}>
          \n
          ***Task ID: ${taskData._id}***
        `;

    const taskAnnounceEmbed = new EmbedBuilder().setAuthor({
      name: interaction.user.displayName,
      iconURL: interaction.user.avatarURL(),
    });

    const taskOfficialMember = await interaction.guild.members.fetch(
      taskOfficial
    );

    const taskOfficialDMChannel = await taskOfficialMember.createDM(true);
    const announceMsgId = await taskOfficialDMChannel.send({
      content: taskAnnounceContent,
      embeds: [taskAnnounceEmbed],
    });

    const DMMsgId = await tasksRoom.send({
      content: taskAnnounceContent,
      embeds: [taskAnnounceEmbed],
    });

    interaction.editReply({
      ephemeral: true,
      content: 'Task have been created successfully',
    });
  },

  allowed: null,
};
