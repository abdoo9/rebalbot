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

feature.callbackQuery(/reject:.*/, logHandle("callback-query"), async (ctx) => {
  const requestId = ctx.callbackQuery.data.split(":")[1];
  const userId = ctx.callbackQuery.data.split(":")[2];
  await ctx.answerCallbackQuery({
    text: `${ctx.t("request.request-rejected", { requestId })}`,
    show_alert: true,
  });
  await ctx.api.sendMessage(
    ctx.callbackQuery.message?.chat.id ?? config.EXCHANGE_RATE_GROUP_ID,
    `${ctx.t("request.request-rejected", { requestId })}`,
  );

  await ctx.api.sendMessage(
    userId,
    `${ctx.t("request.request-rejected", { requestId })}`,
  );
});

feature.callbackQuery(
  /approve:.*/,
  logHandle("callback-query"),
  async (ctx) => {
    const requestId = ctx.callbackQuery.data.split(":")[1];
    const userId = ctx.callbackQuery.data.split(":")[2];
    await ctx.answerCallbackQuery({
      text: `${ctx.t("request.request-approved", { requestId })}`,
      show_alert: true,
    });
    await ctx.api.sendMessage(
      ctx.callbackQuery.message?.chat.id ?? config.EXCHANGE_RATE_GROUP_ID,
      `${ctx.t("request.request-approved", { requestId })}`,
    );

    await ctx.api.sendMessage(
      userId,
      `${ctx.t("request.request-approved", { requestId })}`,
    );
  },
);

export { composer as callbackQueryFeature };
