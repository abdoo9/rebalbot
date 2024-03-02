import { Composer, InputMediaBuilder } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";
import { escapeHTML } from "../helpers/escape-html.js";

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
          AdminTransaction: {
            create: {
              telegramId: ctx.message.from?.id,
              description: "قام بالموافقة على الطلب",
            },
          },
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
      const userProofImage = ctx.message.reply_to_message?.photo?.[0].file_id;
      if (!userProofImage) return;
      const photosForAdmin = [
        InputMediaBuilder.photo(ctx.message.photo?.[0].file_id),
        InputMediaBuilder.photo(userProofImage, {
          caption: ctx.message.reply_to_message?.caption,
          caption_entities: ctx.message.reply_to_message?.caption_entities,
        }),
      ];
      await ctx.api
        .sendMediaGroup(config.LOG_FINISHED_CHANNEL_ID, photosForAdmin)
        .then(async () => {
          await ctx.api.sendMessage(
            config.LOG_FINISHED_CHANNEL_ID,
            `قام <a href="tg://user?id=${ctx.from.id}">${escapeHTML(
              ctx.message.from?.first_name,
            )}</a> بالموافقة على الطلب #${requestId} وتم ارسال الصور للعميل`,
          );
        })
        .then(async () => {
          await ctx.api.deleteMessage(
            chatId,
            ctx.message.reply_to_message?.message_id ?? 0,
          );
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
            const photosForAdmin = [
              ...photos,
              InputMediaBuilder.photo(userProofImage, {
                caption: ctx.message.reply_to_message?.caption,
                caption_entities:
                  ctx.message.reply_to_message?.caption_entities,
              }),
            ];
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
                  AdminTransaction: {
                    create: {
                      User: {
                        connect: {
                          telegramId: ctx.message.from?.id,
                        },
                      },
                      description: "قام بالموافقة على الطلب",
                    },
                  },
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
                .sendMediaGroup(config.LOG_FINISHED_CHANNEL_ID, photosForAdmin)
                .then(async () => {
                  await ctx.api.sendMessage(
                    config.LOG_FINISHED_CHANNEL_ID,
                    `قام <a href="tg://user?id=${ctx.from.id}">${escapeHTML(
                      ctx.message.from?.first_name,
                    )}</a> بالموافقة على الطلب #${requestId} وتم ارسال الصور للعميل`,
                  );
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
      mediaGroups[mediaGroupId].push(ctx.message.photo?.[0].file_id);
    }
  },
);

export { composer as adminProvePayoutFeature };
