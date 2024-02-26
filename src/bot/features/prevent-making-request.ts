import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";

const composer = new Composer<Context>();

const feature = composer;

feature
  .chatType("private")
  .on(
    "message",
    logHandle("private-message-prevent-making-request"),
    async (ctx, next) => {
      const request = await ctx.prisma.request.findFirst({
        where: {
          User: {
            telegramId: ctx.from.id,
          },
          submittedAt: {
            not: undefined,
          },
        },
      });
      if (request && !request.doneAt && request.submittedAt) {
        await ctx.reply(
          ctx.t("request.wait-for-previous-request", {
            requestId: request.id,
          }),
        );
      } else {
        return next();
      }
    },
  );
feature.inlineQuery(
  /.*/,
  logHandle("inline-prevent-making-request"),
  async (ctx, next) => {
    const request = await ctx.prisma.request.findFirst({
      where: {
        User: {
          telegramId: ctx.from.id,
        },
        submittedAt: {
          not: undefined,
        },
      },
    });
    if (request && !request.doneAt && request.submittedAt) {
      await ctx.answerInlineQuery(
        [
          {
            type: "article",
            id: "1",
            title: ctx.t("prevent-making-request.title", {
              requestId: request.id,
            }),
            description: ctx.t("prevent-making-request.description"),
            input_message_content: {
              message_text: ctx.t("prevent-making-request.message", {
                requestId: request.id,
              }),
            },
          },
        ],
        {
          cache_time: 0,
        },
      );
    } else {
      return next();
    }
  },
);

export { composer as preventMakingRequestFeature };
