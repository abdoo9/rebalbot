import { Composer, InputFile } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";
import { getTable } from "../helpers/get-table.js";

const composer = new Composer<Context>();

const feature = composer;

feature.command("rate", logHandle("command-show-rate"), async (ctx) => {
  const exchange = await ctx.prisma.exchangeRate.findMany({
    select: {
      from: true,
      to: true,
      rate: true,
      fee: true,
    },
    orderBy: {
      from: "asc",
    },
  });
  const table = new InputFile(await getTable(exchange));
  ctx.replyWithPhoto(table);
});
feature
  .filter((ctx) => {
    return (
      Number(ctx.chat?.id) === config.ADMINS_CHAT_ID &&
      config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID ===
        ctx.message?.message_thread_id
    );
  })
  .command("t", logHandle("command-show-table"), async (ctx) => {
    const exchange = await ctx.prisma.exchangeRate.findMany({
      select: {
        from: true,
        to: true,
        rate: true,
        fee: true,
        feeThreshold: true,
      },
      orderBy: {
        from: "asc",
      },
    });
    const table = new InputFile(await getTable(exchange));
    ctx.replyWithPhoto(table, {
      message_thread_id: config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID,
    });

    const currencies = await ctx.prisma.currency.findMany({
      select: {
        currency: true,
        adminWallet: true,
      },
    });
    const tableCurrencies = new InputFile(await getTable(currencies));
    ctx.replyWithPhoto(tableCurrencies, {
      message_thread_id: config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID,
    });
  });

export { feature as showTableFeature };
