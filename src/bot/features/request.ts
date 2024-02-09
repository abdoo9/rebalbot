import { Composer, InlineKeyboard } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { i18n } from "../i18n.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");
const fromCurrencies = i18n.locales.map((locale) =>
  i18n.t(locale, "currency.from"),
);
const toCurrencies = i18n.locales.map((locale) =>
  i18n.t(locale, "currency.to"),
);
const fromCurrencyRegex = new RegExp(fromCurrencies.join("|"), "i"); // creates a regex that matches any of the currencies, case insensitive
const toCurrencyRegex = new RegExp(toCurrencies.join("|"), "i"); // creates a regex that matches any of the currencies, case insensitive

// copilot i want the regex to match if the texts includes some text fromCurrencies array
feature.hears(
  fromCurrencyRegex,
  logHandle("message-text"),
  async (ctx, next) => {
    const request = await ctx.prisma.request.findFirst({
      where: {
        User: {
          telegramId: ctx.from?.id,
        },
        submittedAt: undefined,
      },
    });
    if (!request?.fromCurrency) await next();
    const fromCurrency = ctx.message.text?.replace(ctx.match[0], "");
    const requestMessage = await ctx.reply(`you picked ${fromCurrency}`, {
      reply_markup: new InlineKeyboard().switchInlineCurrent(
        ctx.t("request.choose-to-currency"),
        "📥$",
      ),
    });
    await ctx.prisma.request.create({
      data: {
        User: {
          connect: {
            telegramId: ctx.from?.id,
          },
        },
        exchangeRate: 1,
        fromCurrency,
        messageId: requestMessage.message_id,
      },
    });
  },
);

feature.hears(toCurrencyRegex, logHandle("message-text"), async (ctx, next) => {
  const request = await ctx.prisma.request.findFirst({
    where: {
      User: {
        telegramId: ctx.from?.id,
      },
      submittedAt: undefined,
    },
  });

  if (!request?.toCurrency) await next();
  const fromCurrency = request?.fromCurrency ?? " -";
  const toCurrency = `${ctx.message.text?.replace(ctx.match[0], "")} `;
  const requestMessage = await ctx.reply(
    ctx.t("request.text", {
      toCurrency,
      fromCurrency,
      rate: 1,
      amount: ctx.t("request.amount-required", { fromCurrency }),
    }),
  );
  await ctx.prisma.request.create({
    data: {
      User: {
        connect: {
          telegramId: ctx.from?.id,
        },
      },
      exchangeRate: 1,
      fromCurrency,
      messageId: requestMessage.message_id,
    },
  });
});

feature.hears(/\d+/, logHandle("message-text"), async (ctx, next) => {
  const request = await ctx.prisma.request.findFirst({
    where: {
      User: {
        telegramId: ctx.from?.id,
      },
      submittedAt: undefined,
    },
  });

  if (!request?.amount) await next();
  const fromCurrency = request?.fromCurrency ?? " ";
  const toCurrency = `${ctx.message.text?.replace(ctx.match[0], "")} `;
  const requestMessage = await ctx.reply(
    ctx.t("request.text", {
      toCurrency,
      fromCurrency,
      rate: 1,
      amount: 1,
    }),
    {
      reply_markup: new InlineKeyboard().switchInlineCurrent(
        ctx.t("request.choose-to-currency"),
        "📥$",
      ),
    },
  );
  await ctx.prisma.request.create({
    data: {
      User: {
        connect: {
          telegramId: ctx.from?.id,
        },
      },
      exchangeRate: 1,
      fromCurrency,
      messageId: requestMessage.message_id,
    },
  });
});

export { composer as requestFeature };
