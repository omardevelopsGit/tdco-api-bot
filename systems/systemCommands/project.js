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
    .setName('project')
    .setDescription('Create a project')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('The desired name of the project')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('name-arabic')
        .setDescription('The arabic name of the project')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('color')
        .setDescription('Color of the roles for the project')
        .addChoices(
          ...Object.keys(Colors)
            .map((colorName) => {
              return { name: colorName, value: colorName };
            })
            .slice(0, 25)
        )
    ),

  async execute(interaction) {
    const projectNameEn = interaction.options.getString('name');
    const projectNameAr = interaction.options.getString('name-arabic');
    const projectColor =
      Colors[interaction.options.getString('color') || 'Yellow'];

    const guild = interaction.guild;
    const role = await guild.roles.create({
      name: `${projectNameEn} Member`,
      color: projectColor,
    });
    const projectRolesMapPromises = projectRoles.map(async (roleName) => {
      const role = await guild.roles.create({
        name: `${projectNameEn} ${snakeCaseToSentence(roleName)}`,
        color: projectColor,
      });

      return {
        name: roleName,
        id: role.id,
      };
    });
    const projectRolesMap = await Promise.all(projectRolesMapPromises);
    const category = await guild.channels.create({
      type: ChannelType.GuildCategory,
      name: `----- ${projectNameEn} -----`,
      permissionOverwrites: [
        {
          id: role.id,
          allow: ['ViewChannel'], // Allow VIEW_CHANNEL permission for the specified role
        },
        {
          id: '1207054462011838555', // Everyone role
          deny: ['ViewChannel'], // Deny VIEW_CHANNEL permission for the specified role
        },
      ],
    });
    const generalChat = await category.children.create({
      name: '✉┊General Chat',
      type: ChannelType.GuildText,
    });
    const voiceCall = await category.children.create({
      name: '🎤 Quick Call',
      type: ChannelType.GuildVoice,
    });
    const commandsChat = await category.children.create({
      name: '🤖┊Project Commands',
      type: ChannelType.GuildText,
    });
    const tasksChat = await category.children.create({
      name: '📃┊Tasks',
      type: ChannelType.GuildText,
    });
    const announcementChat = await category.children.create({
      name: '📢┊Announcements',
      type: ChannelType.GuildText,
    });

    const headers = new Headers();
    headers.append('Cookie', `jwt=${process.env.API_TOKEN}; Path=/; HttpOnly`);
    headers.append('Content-type', `application/json`);
    const response = await fetch(`${process.env.API}/api/v1/projects/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projectName: {
          en: projectNameEn,
          ar: projectNameAr,
        },
        category: category.id,
        role: role.id,
        projectRooms: {
          generalChat: generalChat.id,
          voiceCall: voiceCall.id,
          commandsChat: commandsChat.id,
          tasksChat: tasksChat.id,
          announcementChat: announcementChat.id,
        },
        projectRoles: projectRolesMap,
      }),
    });

    const body = await response.json();
    if (body.status !== 'success')
      return interaction.reply({
        ephemeral: true,
        content: `Error occured: ${body.message}`,
      });

    interaction.reply({
      ephemeral: true,
      content: `Successfully created the project`,
    });
  },

  allowed: [adminRoleId],
};
