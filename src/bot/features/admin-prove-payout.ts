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
    } else {
      await next();
    }
  },
);

export { composer as adminProvePayoutFeature };
