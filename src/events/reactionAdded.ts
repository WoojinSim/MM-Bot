import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { TARGET_CHANNEL_ID, REACTION_DETECT_MESSAGE, LOG_CHANNEL_ID, ADMIN_IDS } from "../config/config";

export default (client: Client) => {
  client.on("messageReactionAdd", async (reaction, user) => {
    // partial일 경우 fetch하여 데이터를 완전하게 가져오기
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error("메시지 반응을 가져오는 중 오류 발생:", error);
        return;
      }
    }

    // 봇은 반응X
    if (user.bot) return;

    if (reaction.message.channel.id === TARGET_CHANNEL_ID && reaction.message.id === REACTION_DETECT_MESSAGE) {
      try {
        const avatarURL = user.displayAvatarURL({ size: 256 });
        await reaction.users.remove(user.id);

        const embed = new EmbedBuilder()
          .setAuthor({
            name: `${user.displayName} (${user.tag})`,
            iconURL: avatarURL,
          })
          .setThumbnail(avatarURL)
          .setTitle("밍몽수용소 입소 요청")
          .setDescription(
            "구치소에서 수용을 요청하는 인원이 있습니다.\nhttps://discord.com/channels/705326062279589928/1202120902792183862 채널 확인 후 처리 요망"
          )
          .setColor("#A668E0")
          .setFooter({
            text: "밍밍박사",
          })
          .setTimestamp();

        // 로그채널에 알람 전송
        try {
          const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
          if (logChannel instanceof TextChannel) {
            await logChannel.send({ embeds: [embed] });
          }
        } catch (error) {
          console.error(`관리채널에 알림을 보낼 수 없습니다.`, error);
        }

        // 개인 DM으로 알람 전송
        for (const adminId of ADMIN_IDS) {
          try {
            const admin = await client.users.fetch(adminId);
            await admin.send({ embeds: [embed] });
          } catch (error) {
            console.error(`ID ${adminId}의 관리자에게 알림을 보낼 수 없습니다.`, error);
          }
        }
      } catch (error) {
        console.error("관리자들에게 알림을 보낼 수 없습니다.", error);
      }
    }
  });
};
