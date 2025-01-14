import { Client } from "discord.js";
import { updateUserActivity } from "../database/database";

export default (client: Client) => {
  // 채팅 입력시
  client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    updateUserActivity(message.author.id, message.channel.id, message.id, message.author.tag);
  });

  // 음성채널 진입,변경,퇴장시
  client.on("voiceStateUpdate", (oldState, newState) => {
    if (!newState.member || newState.member.user.bot) return;
    if (oldState.channel !== newState.channel) {
      const user = newState.member.user;
      if (newState.channel) updateUserActivity(user.id, newState.channel.id, null, user.tag);
      if (oldState.channel) updateUserActivity(user.id, oldState.channel.id, null, user.tag);
    }
  });

  // 반응 추가할시
  client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;
    updateUserActivity(user.id, reaction.message.channel.id, reaction.message.id, user.tag);
  });
};
