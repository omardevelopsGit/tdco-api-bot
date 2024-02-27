const processData = require('../../utils/processData.js');
const { SlashCommandBuilder, ChannelType } = require('discord.js');

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
    .setName('add-to-project')
    .setDescription('To add an employee to a project')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The person who will be added')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('role')
        .setDescription('The role that this employee will get in this project')
        .setRequired(true)
        .addChoices(
          ...projectRoles.map((role) => {
            return { name: snakeCaseToSentence(role), value: role };
          })
        )
    ),

  async execute(interaction) {
    const headers = new Headers();
    headers.append('Cookie', `jwt=${process.env.API_TOKEN}; Path=/; HttpOnly`);

    // Getting the data from the command
    const user = interaction.options.getUser('user');
    const category = interaction.channel.parent;
    const roleName = interaction.options.getString('role');

    // Checking wether the user is employed or not (authed in the API)
    try {
      const userResponse = await fetch(
        `${process.env.API}/api/v1/users/${user.id}?id_type=discord`,
        {
          method: 'GET',
          headers,
        }
      );

      const userBody = await userResponse.json();

      if (userBody.status !== 'success') throw new Error(userBody.message);

      const userData = userBody.data?.user;

      if (!userData) throw new Error('Not found');
    } catch (e) {
      return interaction.reply({
        ephemeral: true,
        content: `This user does not exist or is not employed yet\nEmploy him by using /employ\nError: ${e.message}`,
      });
    }

    // Getting the project from the API
    const guild = interaction.guild;
    const res = await fetch(
      `${process.env.API}/api/v1/projects/categories/${category.id}`,
      {
        headers,
      }
    );
    const _body = await res.json();
    if (_body.status !== 'success')
      return interaction.reply({
        ephemeral: true,
        content: `Sorry, could not fetch the project: ${_body.message}`,
      });
    const project = _body.data.project;

    // Getting and Adding the required roles for the new project member
    const memberRole = await guild.roles.fetch(project.projectMemberRoleId);
    const projectRole = await guild.roles.fetch(
      project.projectRoles.find((role) => role.name === roleName).id
    );

    const member = await guild.members.fetch(user.id);
    // Checking if the member is already in the project
    if (
      member.roles.cache.some(
        (role) => role.id === memberRole.id || role.id === projectRole.id
      )
    )
      return interaction.reply({
        ephemeral: true,
        content: 'This user is already in this project',
      });
    await member.roles.add(projectRole);
    await member.roles.add(memberRole);

    // Adding the member to the project through the API
    headers.append('Content-type', 'application/json');
    const response = await fetch(
      `${process.env.API}/api/v1/users/${user.id}/projects/${category.id}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          role: roleName,
        }),
      }
    );

    const body = await response.json();
    if (body.status !== 'success')
      return interaction.reply({
        ephemeral: true,
        content: `Error occured: ${body.message}`,
      });

    // Replying to the commander who ordered to add this user
    interaction.reply({
      ephemeral: true,
      content: `${user.displayName} have been added to ${category.name}`,
    });
  },

  allowed: [adminRoleId],
};
