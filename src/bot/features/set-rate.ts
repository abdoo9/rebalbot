import { Composer, InputFile } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";
import { logger } from "#root/logger.js";
import { getTable } from "../helpers/get-table.js";

const composer = new Composer<Context>();

const feature = composer.filter((ctx) => {
  return (
    Number(ctx.chat?.id) === config.ADMINS_CHAT_ID &&
    config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID ===
      ctx.message?.message_thread_id
  );
});

const regex =
  /from:\s*(?<from>.+)\nto:\s*(?<to>.+)\nrate:\s*(?<rate>.+)\nfee:\s*(?<fee>.+)\nfeeThreshold:\s*(?<feeThreshold>.+)/;
feature.on(
  "message:text",
  logHandle("command-EXCHANGE_RATE-group"),
  async (ctx) => {
    const match = ctx.message.text.match(regex);
    if (match?.groups) {
      const { from, to, rate, fee, feeThreshold } = match.groups;
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
            feeThreshold: Number(feeThreshold),
          },
        })
        .then(async () => {
          ctx.reply(
            `from: ${from}\nto: ${to}\nrate: ${rate}\nfee: ${fee}\nfeeThreshold: ${feeThreshold}`,
            {
              message_thread_id: config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID,
            },
          );
          const newExchange = await ctx.prisma.exchangeRate.findMany({
            select: {
              from: true,
              to: true,
              rate: true,
              fee: true,
              feeThreshold: true,
            },
          });
          const table = new InputFile(await getTable(newExchange));
          ctx.replyWithPhoto(table, {
            message_thread_id: config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID,
          });
        })
        .catch((error) => {
          logger.error(error);
          ctx.reply(error.message, {
            message_thread_id: config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID,
          });
        });
    } else {
      ctx.reply("invalid format", {
        message_thread_id: config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID,
      });
    }
  },
);

export { composer as setRateFeature };
