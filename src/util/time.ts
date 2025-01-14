import { CHECK_HOUR } from "../config/config";

/**
 * 그냥 time stamp 반환하는 함수
 * @return String "[YYYY.MM.DD HH:MM:SS]"
 */
export const timeStamp = (): string => {
  const now = new Date();
  const format = (n: number) => `0${n}`.slice(-2);
  return `[${now.getFullYear()}-${format(now.getMonth() + 1)}-${format(now.getDate())} ${format(now.getHours())}:${format(
    now.getMinutes()
  )}:${format(now.getSeconds())}]`;
};

/**
 * 8시 타이머
 * @returns 얼마나 있다가 실행시킬지 (ms 단위)
 */
export const calculateInitialTimeout = () => {
  const now = new Date();
  const nextCheck = new Date();
  nextCheck.setHours(CHECK_HOUR, 0, 0, 0); // 오후 8시로 설정
  // 만약 현재 시간이 오후 8시 이후라면 다음 날 오후 8시로 설정
  if (now >= nextCheck) {
    nextCheck.setDate(nextCheck.getDate() + 1);
  }
  return nextCheck.getTime() - now.getTime(); // 대기 시간 (밀리초 단위)
};
