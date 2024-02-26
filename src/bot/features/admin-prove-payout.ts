import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";

const composer = new Composer<Context>();

const feature = composer.filter((ctx) => {
  return Number(ctx.chat?.id) === config.ADMINS_CHAT_ID;
});

feature.on(
  "message:photo",
  logHandle("admin proof payout img"),
  async (ctx, next) => {
    if (
      ctx.message.reply_to_message?.caption_entities?.[0].type === "text_link"
    ) {
      const customerId =
        ctx.message.reply_to_message.caption_entities?.[0].url.replace(
          "https://t.me/",
          "",
        );
      await ctx.copyMessage(customerId);
      const match = ctx.message.reply_to_message.caption?.match(/#(\d+)/);
      const requestId = match?.[1];
      if (!match || !requestId) {
        await next();
        return;
      }
      const chatId = ctx.message?.chat.id ?? 0;

      await ctx.prisma.request.update({
        where: { id: Number(requestId) },
        data: {
          doneAt: new Date(),
        },
      });
      await ctx.api.sendMessage(
        chatId ?? config.ADMINS_CHAT_ID,
        `${ctx.t("request.request-approved", { requestId })}`,
      );

      await ctx.api.sendMessage(
        customerId,
        `${ctx.t("request.request-approved", { requestId })}`,
      );

      await ctx.api
        .forwardMessage(
          chatId,
          chatId,
          ctx.message.reply_to_message?.message_id ?? 0,
          {
            message_thread_id: config.ADMINS_CHAT_FINISED_THREAD_ID,
          },
        )
        .then(async () => {
          await ctx.api.deleteMessage(
            chatId,
            ctx.message.reply_to_message?.message_id ?? 0,
          );
        });
      await ctx.api.sendPhoto(chatId, ctx.message.photo?.[0].file_id, {
        message_thread_id: config.ADMINS_CHAT_FINISED_THREAD_ID,
        caption: `صورة اثبات دفع للطلب #${requestId}`,
      });
    } else {
      await next();
    }
  },
);

export { composer as adminProvePayoutFeature };
