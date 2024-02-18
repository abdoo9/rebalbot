/* eslint-disable unicorn/no-array-reduce */
import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { prisma } from "#root/prisma/index.js";

const composer = new Composer<Context>();
const feature = composer;

const currencies = await prisma.exchangeRate.findMany({
  include: { FromCurrency: true, ToCurrency: true },
});
const fromCurrencies = currencies
  .map((currency) => currency.FromCurrency)
  .reduce(
    (
      unique: { currency: string; sticker: string; adminWallet: string }[],
      item,
    ) => {
      return unique.findIndex((object) => object.currency === item.currency) >=
        0
        ? unique
        : [...unique, item];
    },
    [],
  );

const toCurrencies = currencies
  .map((currency) => currency.ToCurrency)
  .reduce(
    (
      unique: { currency: string; sticker: string; adminWallet: string }[],
      item,
    ) => {
      return unique.findIndex((object) => object.currency === item.currency) >=
        0
        ? unique
        : [...unique, item];
    },
    [],
  );
feature.inlineQuery("📤$", logHandle("inline-query-currency"), async (ctx) => {
  await ctx.answerInlineQuery(
    fromCurrencies.map((currency) => {
      return {
        type: "sticker",
        sticker_file_id: currency.sticker,
        id: currency.currency,
        title: currency.currency,
        description: ctx.t("currency.the-currency-you-want-to-send"),
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `${ctx.t("currency.from")} ${currency.currency}`,
                callback_data: "alert_you_picked_the_currency_you_want_to_send",
              },
            ],
          ],
        },
      };
    }),
    { cache_time: 0 },
  );
});
feature.inlineQuery("📥$", logHandle("inline-query-currency"), async (ctx) => {
  await ctx.answerInlineQuery(
    toCurrencies.map((currency) => {
      return {
        type: "sticker",
        sticker_file_id: currency.sticker,
        id: currency.currency,
        title: currency.currency,
        description: ctx.t("currency.the-currency-you-want-to-receive"),
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `${ctx.t("currency.to")} ${currency.currency}`,
                callback_data:
                  "alert_send_the_ammount_of_money_you_want_to_receive",
              },
            ],
          ],
        },
      };
    }),
    { cache_time: 0 },
  );
});
export { composer as inlineQueryFeature };
