import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";
import { getRandomTopicColor } from "../helpers/get-random-topic-color.js";
import { endsWithDashAndNumber } from "../helpers/string-ends-with-dash-and-number.js";

const composer = new Composer<Context>();

const feature = composer;

feature
  .chatType("private")
  .on(
    [
      "message:text",
      "message:sticker",
      "message:photo",
      "message:video",
      "message:voice",
      "message:audio",
      "message:document",
      "message:animation",
      "message:video_note",
      "message:contact",
    ],
    logHandle("log message to topic"),
    async (ctx, next) => {
      if (ctx.session.logTopicThreadId) {
        await ctx.api.forwardMessage(
          config.LOG_GROUP_ID,
          ctx.chat.id,
          ctx.message.message_id,
          {
            message_thread_id: ctx.session.logTopicThreadId,
          },
        );
        next();
      } else {
        const newTopic = await ctx.api.createForumTopic(
          config.LOG_GROUP_ID,
          `${(`${ctx.from?.first_name} ${ctx.from?.last_name}` ?? " ").slice(
            0,
            120 - (ctx.from?.id?.toString() ?? "").length,
          )}-${ctx.from?.id}`,
          {
            icon_color: getRandomTopicColor(),
          },
        );
        ctx.session.logTopicThreadId = newTopic.message_thread_id;
        await ctx.api.forwardMessage(
          config.LOG_GROUP_ID,
          ctx.chat.id,
          ctx.message.message_id,
          {
            message_thread_id: ctx.session.logTopicThreadId,
          },
        );
        next();
      }
    },
  );

feature

  .filter(
    (ctx) =>
      ctx.message?.chat.id === config.LOG_GROUP_ID &&
      endsWithDashAndNumber(
        ctx.message?.reply_to_message?.forum_topic_created?.name,
      ),
  )
  .on(
    [
      "message:text",
      "message:sticker",
      "message:photo",
      "message:video",
      "message:voice",
      "message:audio",
      "message:document",
      "message:animation",
      "message:video_note",
      "message:contact",
    ],
    logHandle("reply to log message to topic"),
    async (ctx, next) => {
      const userId = ctx.message?.reply_to_message?.forum_topic_created?.name
        .split("-")
        .at(-1);
      if (!userId) return next();
      ctx.copyMessage(userId);
    },
  );

feature
  .filter(
    (ctx) =>
      ctx.message?.chat.id === config.LOG_GROUP_ID &&
      !!ctx.message.reply_to_message &&
      !ctx.message.reply_to_message?.forum_topic_created,
  )
  .on("message", logHandle("reply to log message in topic"), async (ctx) => {
    ctx.reply(
      "لا تقم بالرد على هذه الرسالة هنا يرجى ارسال الرسالة بدون رد ليتم توصيلها الى العميل",
    );
  });

export { composer as topicLogMessagesFeature };
