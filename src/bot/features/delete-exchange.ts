import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";

const composer = new Composer<Context>();

const feature = composer.filter((ctx) => {
  return (
    Number(ctx.chat?.id) === config.EXCHANGE_RATE_GROUP_ID &&
    !!ctx.message?.text?.startsWith("/delete")
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
          ctx.reply(`تم حذف التحويل \nfrom: ${from}\nto: ${to}`);
        })
        .catch((error) => {
          ctx.reply(error.message);
        });
    }
  },
);

export { composer as deleteExchangeFeature };
