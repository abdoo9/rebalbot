import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";
import { getTable } from "../helpers/get-table.js";

const composer = new Composer<Context>();

const feature = composer.filter((ctx) => {
  return Number(ctx.chat?.id) === config.EXCHANGE_RATE_GROUP_ID;
});

const regex =
  /from:\s*(?<from>.+)\nto:\s*(?<to>.+)\nrate:\s*(?<rate>.+)\nfee:\s*(?<fee>.+)/;
feature.on(
  "message:text",
  logHandle("command-EXCHANGE_RATE-group"),
  async (ctx) => {
    const match = ctx.message.text.match(regex);
    ctx.reply("I got it!");
    if (match?.groups) {
      const { from, to, rate, fee } = match.groups;
      await ctx.prisma.exchangeRate
        .update({
          where: {
            unique_from_to: {
              from,
              to,
            },
          },
          data: {
            rate: Number(rate),
            fee: Number(fee),
          },
        })
        .then(async () => {
          ctx.reply(`from: ${from}\nto: ${to}\nrate: ${rate}\nfee: ${fee}`);
          const newExchange = await ctx.prisma.exchangeRate.findMany({
            select: { from: true, to: true, rate: true, fee: true },
          });
          ctx.reply(getTable(newExchange), { parse_mode: "HTML" });
        })
        .catch((error) => {
          ctx.reply(error.message);
        });
    }
  },
);

export { composer as setRateFeature };
