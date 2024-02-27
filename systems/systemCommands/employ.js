const { SlashCommandBuilder } = require('discord.js');

const adminRoleId = '1207706612140343296';
const empRoleId = '1209179489582583848';
module.exports = {
  data: new SlashCommandBuilder()
    .setName('employ')
    .setDescription('To add a new person to a work space')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The person who will be employed')
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user');

    const headers = new Headers();
    headers.append('Cookie', `jwt=${process.env.API_TOKEN}; Path=/; HttpOnly`);
    headers.append('Content-type', `application/json`);
    const response = await fetch(`${process.env.API}/api/v1/users/signup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: user.id,
      }),
    });

    const body = await response.json();
    if (body.status !== 'success')
      return interaction.reply({
        ephemeral: true,
        content: `Error occured: ${body.message}`,
      });

    const member = await interaction.guild.members.fetch(user.id);
    const role = await interaction.guild.roles.fetch(empRoleId);
    await member.roles.add(role);

    interaction.reply({
      ephemeral: true,
      content: 'The signup link will be sent to the new employee',
    });

    const dmChannel = await user.createDM();
    dmChannel.send(
      `# Signup #\nHello, this is TDCO projects managing system\nOne of the admins ordered me to add you to the server\n[Click here](${process.env.API}/signup?discordToken=${body.data.discordToken}) please in order to signup and fill in your data\n## Please go to the link as soon as possible, and dont share it (you've only 10 minutes for doing this) ##`
    );
  },

  allowed: [adminRoleId],
};
