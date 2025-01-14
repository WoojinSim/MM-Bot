import { Client, ActivityType, TextChannel } from "discord.js";
import { timeStamp } from "../util/time";

export default (client: Client) => {
  client.on("ready", async () => {
    client.user?.setActivity("수감자들 감시", { type: ActivityType.Playing });
    console.log(`${timeStamp()} 밍밍박사가 이제 온라인 상태입니다.`);

    /*
    try {
      // 채널과 메시지를 불러오기
      const channel = await client.channels.fetch(TARGET_CHANNEL_ID);
      if (channel?.isTextBased()) {
        const message = await channel.messages.fetch(REACTION_DETECT_MESSAGE);

        // 메시지에 이모지 반응 추가
        await message.react("✅");
      }
    } catch (error) {
      console.error("메시지에 반응을 추가하는 중 오류가 발생했습니다:", error);
    }
    */
  });
};
