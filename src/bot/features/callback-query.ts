import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";

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

export { composer as callbackQueryFeature };
