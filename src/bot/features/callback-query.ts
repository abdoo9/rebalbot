import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";

const getRequestId = (caption: string | undefined) => {
  const match = caption?.match(/#(\d+)/);
  return match?.[1];
};

const composer = new Composer<Context>();
const feature = composer;

feature.callbackQuery(
  "alert_send_the_ammount_of_money_you_want_to_send",
  logHandle("callback-query-currency"),
  async (ctx) => {
    await ctx.answerCallbackQuery({
      text: ctx.t("currency.send-the-ammount-of-money-you-want-to-send"),
      show_alert: true,
    });
  },
);

feature.callbackQuery(
  "alert_send_the_ammount_of_money_you_want_to_send",
  logHandle("callback-query-currency"),
  async (ctx) => {
    await ctx.answerCallbackQuery({
      text: ctx.t("currency.send-the-ammount-of-money-you-want-to-send"),
      show_alert: true,
    });
  },
);

feature.callbackQuery(
  "alert_request_submitted",
  logHandle("callback-query"),
  async (ctx) => {
    await ctx.answerCallbackQuery({
      text: ctx.t("request.submitted"),
      show_alert: true,
    });
  },
);

feature.callbackQuery(
  /adminConfirmedReceipt:.*/,
  logHandle("callback-query-admin-confirmed-receipt"),
  async (ctx) => {
    const isZainCash =
      ctx.callbackQuery.message?.caption?.includes("الى عملة: zainCash");
    await ctx.answerCallbackQuery({
      text: ctx.t("admin.receipt-confirmed"),
      show_alert: true,
    });
    const replyMarkup = ctx.callbackQuery.message?.reply_markup;
    replyMarkup?.inline_keyboard[0].pop();
    replyMarkup?.inline_keyboard.push([
      {
        text: ctx.t("رد بصورة اثبات التحويل"),
        callback_data: "_",
      },
    ]);
    await ctx.prisma.adminTransaction.create({
      data: {
        User: {
          connect: {
            telegramId: ctx.callbackQuery.from.id,
          },
        },
        description: "قام بتاكيد استلام الطلب",
        Request: {
          connect: {
            id: Number(ctx.callbackQuery.data.split(":")[1]),
          },
        },
      },
    });
    await ctx.copyMessage(config.ADMINS_CHAT_ID, {
      reply_markup: replyMarkup,
      message_thread_id: isZainCash
        ? config.ADMINS_CHAT_ZAINCASH_REQUESTS_THREAD_ID
        : config.ADMINS_CHAT_PROCESSING_THREAD_ID,
    });
    await ctx.editMessageCaption({
      caption:
        `#${getRequestId(ctx.callbackQuery.message?.caption)}_R` ?? "error",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `تم بواسطة ${ctx.from.first_name}`.slice(0, 64),
              url: `tg://user?id=${ctx.from.id}`,
            },
          ],
        ],
      },
    });
  },
);
feature.callbackQuery(/reject:.*/, logHandle("callback-query"), async (ctx) => {
  const requestId = ctx.callbackQuery.data.split(":")[1];
  const userId = ctx.callbackQuery.data.split(":")[2];
  const chatId = ctx.callbackQuery.message?.chat.id ?? 0;
  await ctx.prisma.request.update({
    where: { id: Number(requestId) },
    data: {
      isRejected: {
        set: true,
      },
      doneAt: new Date(),
      AdminTransaction: {
        create: {
          telegramId: ctx.callbackQuery.from.id,
          description: "قام برفض الطلب",
        },
      },
    },
  });
  await ctx.answerCallbackQuery({
    text: `${ctx.t("request.request-rejected", { requestId })}`,
    show_alert: true,
  });
  await ctx.api.sendMessage(
    ctx.callbackQuery.message?.chat.id ?? config.ADMINS_CHAT_ID,
    `${ctx.t("request.request-rejected", { requestId })}`,
  );

  await ctx.api.sendMessage(
    userId,
    `${ctx.t("request.request-rejected", { requestId })}`,
  );
  await ctx.api
    .forwardMessage(
      chatId,
      chatId,
      ctx.callbackQuery.message?.message_id ?? 0,
      { message_thread_id: config.ADMINS_CHAT_REJECTED_THREAD_ID },
    )
    .then(async () => {
      await ctx.api.deleteMessage(
        chatId,
        ctx.callbackQuery.message?.message_id ?? 0,
      );
    });
});

// feature.callbackQuery(
//   /approve:.*/,
//   logHandle("callback-query"),
//   async (ctx) => {
//     const requestId = ctx.callbackQuery.data.split(":")[1];
//     const userId = ctx.callbackQuery.data.split(":")[2];
//     const chatId = ctx.callbackQuery.message?.chat.id ?? 0;

//     await ctx.prisma.request.update({
//       where: { id: Number(requestId) },
//       data: {
//         doneAt: new Date(),
//       },
//     });
//     await ctx.answerCallbackQuery({
//       text: `${ctx.t("request.request-approved", { requestId })}`,
//       show_alert: true,
//     });
//     await ctx.api.sendMessage(
//       ctx.callbackQuery.message?.chat.id ?? config.ADMINS_CHAT_ID,
//       `${ctx.t("request.request-approved", { requestId })}`,
//     );

//     await ctx.api.sendMessage(
//       userId,
//       `${ctx.t("request.request-approved", { requestId })}`,
//     );

//     await ctx.api
//       .forwardMessage(
//         config.LOG_FINISHED_CHANNEL_ID,
//         chatId,
//         ctx.callbackQuery.message?.message_id ?? 0,
//       )
//       .then(async () => {
//         await ctx.api.deleteMessage(
//           chatId,
//           ctx.callbackQuery.message?.message_id ?? 0,
//         );
//       });
//   },
// );

export { composer as callbackQueryFeature };
