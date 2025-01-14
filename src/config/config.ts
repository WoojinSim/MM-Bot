import dotenv from "dotenv";
dotenv.config();

export const ADMIN_IDS = [
  "269157371564130306", // 심
  "278052261089771523", // 나
  "246235808514834433", // 연
];
export const GUILD_ID = process.env.GUILD_ID as string;
export const BOT_ID = process.env.BOT_ID as string;
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN as string;
export const TARGET_CHANNEL_ID = "1202120902792183862";
export const REACTION_DETECT_MESSAGE = "1299404501349830748";
export const LOG_CHANNEL_ID = "1300466977113903167";
export const CHECK_HOUR = 20;
export const INACTIVITY_LIMIT = 15 * 24 * 60 * 60 * 1000;
export const ROLE_ID_TO_REMOVE = "755395432942665758";
export const CHAT_CHANNEL_ID = "705326062279589931";
