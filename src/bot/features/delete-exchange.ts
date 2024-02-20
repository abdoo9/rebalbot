import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";

const composer = new Composer<Context>();

const feature = composer.filter((ctx) => {
  return (
    Number(ctx.chat?.id) === config.ADMINS_CHAT_ID &&
    !!ctx.message?.text?.startsWith("/delete") &&
    config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID === ctx.message.message_thread_id
  );
});

const regex = /\/delete\nfrom:\s*(?<from>.+)\nto:\s*(?<to>.+)/;
feature.on(
  "message:text",
  logHandle("command-EXCHANGE_RATE_GROUP"),
  async (ctx) => {
    const match = ctx.message.text.match(regex);
    if (match?.groups) {
      const { from, to } = match.groups;
      await ctx.prisma.exchangeRate
        .deleteMany({
          where: {
            from,
            to,
          },
        })
        .then(async () => {
          ctx.reply(`تم حذف التحويل \nfrom: ${from}\nto: ${to}`, {
            message_thread_id: config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID,
          });
        })
        .catch((error) => {
          ctx.reply(error.message, {
            message_thread_id: config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID,
          });
        });
    }
  },
);

export { composer as deleteExchangeFeature };
