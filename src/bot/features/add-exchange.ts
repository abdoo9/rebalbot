import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";

const composer = new Composer<Context>();

const feature = composer.filter((ctx) => {
  return (
    Number(ctx.chat?.id) === config.EXCHANGE_RATE_GROUP_ID &&
    !!ctx.message?.text?.startsWith("/add")
  );
});

const regex =
  /\/add\nfrom:\s*(?<from>.+)\nto:\s*(?<to>.+)\nrate:\s*(?<rate>.+)\nfee:\s*(?<fee>.+)\nfeeThreshold:\s*(?<feeThreshold>.+)/;
feature.on("message:text", logHandle("command-channel"), async (ctx) => {
  const match = ctx.message.text.match(regex);
  if (match?.groups) {
    const { from, to, rate, fee, feeThreshold } = match.groups;
    await ctx.prisma.exchangeRate
      .create({
        data: {
          from,
          to,
          rate: Number(rate),
          fee: Number(fee),
          feeThreshold: Number(feeThreshold),
        },
      })
      .then(() => {
        ctx.reply(
          `تم اضافة عملية تحويل جديدة \n from: ${from}\nto: ${to}\nrate: ${rate}\nfee: ${fee}\nfeeThreshold: ${feeThreshold}`,
        );
      })
      .catch((error) => {
        ctx.reply(error.message);
      });
  }
});

export { composer as addExchangeFeature };
