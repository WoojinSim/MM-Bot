const Database = require("better-sqlite3");
const db = new Database("activity.db");

import { timeStamp } from "../util/time";
import { INACTIVITY_LIMIT } from "../config/config";

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    lastActivity INTEGER NOT NULL,
    lastChannelID TEXT,
    lastContentID TEXT
  )
`
).run();

// 활동 시간 가져오는 함수
/**
 * 사용자ID를 넘겨주면 DB 데이터들 넘겨주는 함수
 * @param userId 사용자ID
 * @returns 오브잭트 id: string; lastActivity: number; lastChannelID: string; lastContentID: string | null
 */
export const getUserActivity = (
  userId: string
): { id: string; lastActivity: number; lastChannelID: string; lastContentID: string | null } | undefined => {
  try {
    const result = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
    return result;
  } catch (e) {
    console.error(e);
  }
  return;
};

/**
 * 활동 업데이트 함수
 * @param userId 사용자ID
 * @param channelID 마지막 사용 채널
 * @param contentID 마지막 채팅 (선택)
 * @param userTag 사용자 태그 (선택)
 */
export const updateUserActivity = (
  userId: string,
  channelID: string,
  contentID?: string | null,
  userTag?: string | undefined | null
) => {
  const timestamp = Date.now();
  try {
    db.prepare(`INSERT OR REPLACE INTO users (id, lastActivity, lastChannelID, lastContentID) VALUES (?, ?, ?, ?) `).run(
      userId,
      timestamp,
      channelID,
      contentID ? contentID : null
    );
    console.log(`${timeStamp()} ${userTag ? userTag : "알수없음"}(${userId}) 마지막활동시간 갱신`);
  } catch (e) {
    console.log(`${timeStamp()} ${userTag ? userTag : "알수없음"}(${userId}) 마지막활동시간 갱신 실패 (오류)`);
  }
};

/**
 * 마지막 활동시간이 limit 만큼의 시간(밀리세컨드)보다 지난 모든 사용자ID 반환
 * @param limit
 * @returns
 */
export const getInactiveUsers = (limit: number = INACTIVITY_LIMIT) => {
  const threshold = Date.now() - limit;
  return db.prepare(`SELECT id FROM users WHERE lastActivity < ?`).all(threshold);
};

export default db;
