import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";
import { logger } from "#root/logger.js";

const composer = new Composer<Context>();

const feature = composer.filter((ctx) => {
  return (
    Number(ctx.chat?.id) === config.ADMINS_CHAT_ID &&
    config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID ===
      ctx.message?.message_thread_id &&
    !!ctx.message?.text?.match("دفع جزئي")
  );
});

feature.on(
  "message:text",
  logHandle("command-EXCHANGE_RATE-group"),
  async (ctx) => {
    const match = ctx.message.text.match(/دفع جزئي\s*(?<amount>.+)/);
    if (match?.groups) {
      const { amount } = match.groups;
      logger.info(amount);
      ctx.reply(`دفع جزئي: ${amount}`);
    }
  },
);

export { composer as partialPaymentFeature };
