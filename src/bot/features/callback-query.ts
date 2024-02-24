import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";

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
        text: ctx.t("request.approve"),
        callback_data: `approve:${ctx.callbackQuery.data.split(":")[1]}:${
          ctx.callbackQuery.data.split(":")[2]
        }`,
      },
    ]);
    await ctx.editMessageReplyMarkup({
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
    await ctx.copyMessage(config.ADMINS_CHAT_ID, {
      reply_markup: replyMarkup,
      message_thread_id: isZainCash
        ? config.ADMINS_CHAT_ZAINCASH_REQUESTS_THREAD_ID
        : config.ADMINS_CHAT_PROCESSING_THREAD_ID,
    });
  },
);
feature.callbackQuery(/reject:.*/, logHandle("callback-query"), async (ctx) => {
  const requestId = ctx.callbackQuery.data.split(":")[1];
  const userId = ctx.callbackQuery.data.split(":")[2];
  const chatId = ctx.callbackQuery.message?.chat.id ?? 0;
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

feature.callbackQuery(
  /approve:.*/,
  logHandle("callback-query"),
  async (ctx) => {
    const requestId = ctx.callbackQuery.data.split(":")[1];
    const userId = ctx.callbackQuery.data.split(":")[2];
    const chatId = ctx.callbackQuery.message?.chat.id ?? 0;
    await ctx.answerCallbackQuery({
      text: `${ctx.t("request.request-approved", { requestId })}`,
      show_alert: true,
    });
    await ctx.api.sendMessage(
      ctx.callbackQuery.message?.chat.id ?? config.ADMINS_CHAT_ID,
      `${ctx.t("request.request-approved", { requestId })}`,
    );

    await ctx.api.sendMessage(
      userId,
      `${ctx.t("request.request-approved", { requestId })}`,
    );

    await ctx.api
      .forwardMessage(
        chatId,
        chatId,
        ctx.callbackQuery.message?.message_id ?? 0,
        { message_thread_id: config.ADMINS_CHAT_FINISED_THREAD_ID },
      )
      .then(async () => {
        await ctx.api.deleteMessage(
          chatId,
          ctx.callbackQuery.message?.message_id ?? 0,
        );
      });
  },
);

export { composer as callbackQueryFeature };
