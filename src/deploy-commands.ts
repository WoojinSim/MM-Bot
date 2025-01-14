// src/deploy-commands.ts
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { BOT_ID, GUILD_ID, DISCORD_TOKEN } from "./config/config";
import { timeStamp } from "./util/time";
import fs from "fs";
import path from "path";

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`${timeStamp()} 슬래시(/) 명령어들의 갱신을 시작합니다.`);
    await rest.put(Routes.applicationGuildCommands(BOT_ID, GUILD_ID), { body: commands });
    console.log(`${timeStamp()} 슬래시(/) 명령어들의 갱신이 성공적으로 완료됐습니다.`);
  } catch (error) {
    console.error(error);
  }
})();
