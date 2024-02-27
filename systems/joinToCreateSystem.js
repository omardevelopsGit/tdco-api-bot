const catchAsync = require('../utils/catchAsync.js');
const client = require('../utils/discordClient.js');
const { ChannelType } = require('discord.js');
const processData = require('../utils/processData.js');

client.on(
  'voiceStateUpdate',
  catchAsync(async (oldState, newState) => {
    const headers = new Headers();
    headers.append('Cookie', `jwt=${process.env.API_TOKEN}; Path=/; HttpOnly`);

    const member = newState.member;
    const oldChannel = oldState.channel;
    const channel = member?.voice?.channel;

    if (
      channel &&
      channel.members.size === 1 &&
      !channel.name.startsWith('QVC')
    ) {
      const newChannel = await channel.guild.channels.create({
        name: 'QVC┊Quick Voice Call',
        type: ChannelType.GuildVoice,
        userLimit: 20,
        parent: channel.parentId,
      });

      member.voice.setChannel(newChannel);

      // Announcing that there is a call running
      const projectRes = await fetch(
        `${process.env.API}/api/v1/projects/categories/${channel.parentId}`,
        { headers }
      );
      const body = await projectRes.json();
      if (body.status === 'success') {
        const project = body.data.project;

        const projectAnnounceRoom = await oldState.guild.channels.fetch(
          project.projectRooms.announcementChat
        );

        await projectAnnounceRoom.send(`
            # Quick call is made # 
            \n
            ### By: ${member.displayName} ###
            \n
            Join: <#${newChannel.id}>
            \n
            ||@everyone @here||
        `);
      }
    }

    const filteredOldChannelMembers = oldChannel?.members?.filter(
      (member) => !member.user.bot
    );

    if (
      oldChannel &&
      oldChannel.name.startsWith('QVC') &&
      filteredOldChannelMembers.size < 1
    ) {
      // It is Chat Voice Channel, and it is empty now
      await oldChannel.delete();
    }
  })
);
