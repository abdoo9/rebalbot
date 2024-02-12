import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";

const composer = new Composer<Context>();

const feature = composer.filter((ctx) => {
  return (
    Number(ctx.chat?.id) === config.EXCHANGE_RATE_CHANNEL_ID &&
    !!ctx.channelPost?.text?.startsWith("/delete")
  );
});

const regex = /\/delete\nfrom:\s*(?<from>.+)\nto:\s*(?<to>.+)/;
feature.on("channel_post:text", logHandle("command-channel"), async (ctx) => {
  const match = ctx.channelPost.text.match(regex);
  ctx.reply("I got it!");
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
        ctx.reply(`Exchange has been deleted \n from: ${from}\nto: ${to}`);
      })
      .catch((error) => {
        ctx.reply(error.message);
      });
  }
});

export { composer as deleteExchangeFeature };
