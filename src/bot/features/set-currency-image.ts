import { Composer, InputFile } from "grammy";
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
    Number(ctx.chat?.id) === config.ADMINS_CHAT_ID &&
    !!ctx.message?.reply_to_message?.sticker &&
    config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID === ctx.message.message_thread_id
  );
});

feature.on("message:text", logHandle("add-currency"), async (ctx) => {
  const adminWallet = ctx.message.text;
  const currencyName =
    ctx.message.reply_to_message?.reply_markup?.inline_keyboard[0][0].text;
  const stickerFileId = ctx.message.reply_to_message?.sticker?.file_id;
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
        ctx.reply(`new image for ${currencyName} is set`, {
          message_thread_id: config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID,
        });
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
    await ctx.reply(
      "only stickers with button of the currency name are accepted",
      {
        message_thread_id: config.ADMINS_CHAT_RATE_SETTINGS_THREAD_ID,
      },
    );
  }
});

export { composer as setCurrencyImageFeature };
