import { Context } from "../context.js";

export function getUserIDFromTopicName(ctx: Context) {
  return ctx.message?.reply_to_message?.forum_topic_created?.name
    .split("-")
    .at(-1);
}
