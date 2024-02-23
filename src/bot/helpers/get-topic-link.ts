import { config } from "#root/config.js";

export function getTopicLink(logTopicThreadId: number) {
  const logGroupId = config.LOG_GROUP_ID;
  return `https://t.me/c/${logGroupId.toString().slice(4)}/${logTopicThreadId}`;
}
