import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import { DISCORD_TOKEN, GUILD_ID } from "./config/config";
import { calculateInitialTimeout, timeStamp } from "./util/time";
import { getInactiveUsers } from "./database/database";
import fs from "fs";
import path from "path";

// 봇이 받아들일 데이터들 명시
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
}) as Client & { commands: Collection<string, any> };

// 이벤트 로드 & 헨들러
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".ts"));
let successCount = 0;
let failCount = 0;
console.log(`${timeStamp()} 이벤트 리스너 로드 시작`);
for (const file of eventFiles) {
  try {
    const event = require(`./events/${file}`).default;
    event(client);
    console.log(`${timeStamp()} └ 이벤트 리스너 ${file} 로드됨`);
    successCount++;
  } catch (error) {
    console.log(`${timeStamp()} └ 이벤트 리스너 ${file} 로드 중 오류 발생`);
    console.error(error);
    failCount++;
  }
}
console.log(`${timeStamp()} ${eventFiles.length} 개 중 ${successCount} 개의 이벤트 리스너 로드 완료`);

// 명령어 모듈 파일들 로드
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// 명령어 핸들러
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "명령어를 실행하는데 문제가 발생했어요! 콘솔을 확인해주세요.", ephemeral: true });
  }
});

// 특정 역할 제거 함수
const noticeInactiveUsers = async () => {
  const inactiveUsers = getInactiveUsers(15 * 24 * 60 * 60 * 1000);
  //const ROLE_ID_TO_REMOVE = "755395432942665758"; // 제거할 역할 ID
  console.log(`${timeStamp()} 비활성유저 탐색`);
  try {
    const guild = await client.guilds.fetch(GUILD_ID);

    for (const user of inactiveUsers) {
      console.log(`${timeStamp()} 사용자 ${user.id} 15일 지남`);
      /* TODO: 나중에 필요해지면 주석 해제
      const member = await guild.members.fetch(user.id).catch(() => null); // ID로 캐릭터 가져오기
      
      if (member && member.roles.cache.has(ROLE_ID_TO_REMOVE)) {
        await member.roles.remove(ROLE_ID_TO_REMOVE);
        console.log(`${timeStamp()} ${member.user.tag}(${member.user.id}) 장기미활동 역할제거)`);
      }
      */
    }
  } catch (error) {
    console.error("역할을 제거하는 중 오류가 발생했습니다:", error);
  }
};

// 비활성유저 검사 사이클
setTimeout(() => {
  noticeInactiveUsers(); // 처음 한 번 실행
  // 이후에는 매일 24시간마다 실행
  setInterval(noticeInactiveUsers, 24 * 60 * 60 * 1000);
}, calculateInitialTimeout());

// 클라이언트 로그인
client.login(DISCORD_TOKEN);
