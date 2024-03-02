import { Composer, InputMediaBuilder } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";

const composer = new Composer<Context>();

const feature = composer.filter((ctx) => {
  return Number(ctx.chat?.id) === config.ADMINS_CHAT_ID;
});

const getCustomerId = (url: string) => {
  return url.replace("https://t.me/", "");
};

const getRequestId = (caption: string | undefined) => {
  const match = caption?.match(/#(\d+)/);
  return match?.[1];
};

interface MediaGroupTimestamps {
  [key: string]: number;
}
const mediaGroups: {
  [key: string]: Array<string>;
} = {};
const mediaGroupTimestamps: MediaGroupTimestamps = {};

feature.on(
  "message:photo",
  logHandle("admin proof payout singe img"),
  async (ctx, next) => {
    if (
      ctx.message.reply_to_message?.caption_entities?.[0].type ===
        "text_link" &&
      !ctx.message.media_group_id
    ) {
      const customerId = getCustomerId(
        ctx.message.reply_to_message.caption_entities?.[0].url,
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

feature.on(
  "message:photo",
  logHandle("admin proof payout group img"),
  async (ctx, next) => {
    if (
      ctx.message.reply_to_message?.caption_entities?.[0].type ===
        "text_link" &&
      ctx.message.media_group_id
    ) {
      const mediaGroupId = ctx.message.media_group_id;
      if (!mediaGroups[mediaGroupId]) {
        mediaGroups[mediaGroupId] = [];
      }
      mediaGroups[mediaGroupId].push(ctx.message.photo?.[0].file_id);

      // Update the timestamp of the last received photo for this media group

      mediaGroupTimestamps[mediaGroupId] = Date.now();

      setTimeout(async () => {
        // Check if no new photos have been added for 1 second
        if (Date.now() - mediaGroupTimestamps[mediaGroupId] >= 1000) {
          const photos = mediaGroups[mediaGroupId].map((fileId) => {
            return InputMediaBuilder.photo(fileId);
          });
          const userProofImage =
            ctx.message.reply_to_message?.photo?.[0].file_id;
          if (!userProofImage) return;
          photos.push(
            InputMediaBuilder.photo(userProofImage, {
              caption: ctx.message.reply_to_message?.caption,
              caption_entities: ctx.message.reply_to_message?.caption_entities,
            }),
          );
          if (
            ctx.message.reply_to_message?.caption_entities?.[0].type ===
            "text_link"
          ) {
            const customerId = getCustomerId(
              ctx.message?.reply_to_message?.caption_entities?.[0].url,
            );
            await ctx.api.sendMediaGroup(customerId, photos);
            const requestId = getRequestId(
              ctx.message?.reply_to_message?.caption,
            );
            if (!requestId) {
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
              .sendMediaGroup(chatId, photos, {
                message_thread_id: config.ADMINS_CHAT_FINISED_THREAD_ID,
              })

              .then(async () => {
                await ctx.api.deleteMessage(
                  chatId,
                  ctx.message.reply_to_message?.message_id ?? 0,
                );
              });
            delete mediaGroups[mediaGroupId];
            delete mediaGroupTimestamps[mediaGroupId];
          }
        }
      }, 1000);
    }
  },
);

export { composer as adminProvePayoutFeature };
