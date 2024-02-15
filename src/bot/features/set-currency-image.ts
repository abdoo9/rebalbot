import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";
// import { prisma } from "#root/prisma/index.js";
import { logger } from "#root/logger.js";
import { getTable } from "../helpers/get-table.js";

const composer = new Composer<Context>();

// const exchangeRates = await prisma.exchangeRate.findMany({
//   select: {
//     from: true,
//     to: true,
//   },
// });

// const currencies = exchangeRates.flatMap((rate) => [rate.from, rate.to]);

const feature = composer.filter((ctx) => {
  return (
    Number(ctx.chat?.id) === config.EXCHANGE_RATE_CHANNEL_ID &&
    !!ctx.channelPost?.reply_to_message?.sticker
  );
});

feature.on("channel_post", logHandle("add-currency"), async (ctx) => {
  const adminWallet = ctx.channelPost.text;
  const currencyName =
    ctx.channelPost.reply_to_message?.reply_markup?.inline_keyboard[0][0].text;
  const stickerFileId = ctx.channelPost.reply_to_message?.sticker?.file_id;
  if (!stickerFileId || !adminWallet)
    await ctx.reply(
      "only stickers with button of the currency name are accepted or admin wallet is not set in the message body or sticker is not set in the reply message",
    );
  else if (currencyName) {
    await ctx.prisma.currency
      .upsert({
        where: {
          currency: currencyName,
        },
        create: {
          adminWallet,
          currency: currencyName,
          sticker: stickerFileId,
        },
        update: {
          adminWallet,
          currency: currencyName,
          sticker: stickerFileId,
        },
      })
      .then(async (x) => {
        logger.info(x);
        ctx.reply(`new image for ${currencyName} is set`);
        const newExchange = await ctx.prisma.exchangeRate.findMany({
          select: { from: true, to: true, rate: true, fee: true },
        });
        ctx.reply(getTable(newExchange), { parse_mode: "HTML" });
      })
      .catch((error) => {
        ctx.reply(error.message);
      });
  } else {
    await ctx.reply(
      "only stickers with button of the currency name are accepted",
    );
  }
});

export { composer as setCurrencyImageFeature };
