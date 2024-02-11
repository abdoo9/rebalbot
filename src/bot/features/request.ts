import { Composer, InlineKeyboard } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { logger } from "#root/logger.js";
import { config } from "#root/config.js";
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
feature.hears(fromCurrencyRegex, logHandle("message-text"), async (ctx) => {
  const { count: deletedCount } = await ctx.prisma.request.deleteMany({
    where: {
      User: {
        telegramId: ctx.from?.id,
      },
      submittedAt: undefined,
    },
  });
  logger.info(
    `deleted ${deletedCount} requests from database this shouldn't happen too often`,
  );

  const fromCurrency = ctx.message.text?.replace(ctx.match[0], "");
  const requestMessage = await ctx.reply(`you picked ${fromCurrency}`, {
    reply_markup: new InlineKeyboard().switchInlineCurrent(
      ctx.t("request.choose-to-currency"),
      "📥$",
    ),
  });
  const request = await ctx.prisma.request.create({
    data: {
      User: {
        connect: {
          telegramId: ctx.from?.id,
        },
      },
      exchangeRate: 0,
      fromCurrency,
      messageId: requestMessage.message_id,
    },
  });
  ctx.session.notSubmittedRequestId = request.id;
});

feature.hears(toCurrencyRegex, logHandle("message-text"), async (ctx) => {
  const request = await ctx.prisma.request.findUnique({
    where: {
      id: ctx.session.notSubmittedRequestId,
    },
  });
  const fromCurrency = request?.fromCurrency ?? "error";
  const toCurrency = `${ctx.message.text?.replace(ctx.match[0], "")} `;
  const requestMessage = await ctx.reply(
    ctx.t("request.text", {
      fromCurrency,
      toCurrency,
      fromWallet: "not-provided",
      exchangeRate: 1320,
      amount: ctx.t("request.amount-required", { fromCurrency }),
    }),
  );
  await ctx.prisma.request.update({
    where: {
      id: ctx.session.notSubmittedRequestId,
    },
    data: {
      toCurrency,
      messageId: requestMessage.message_id,
    },
  });
});

feature.hears(/\d+/, logHandle("message-text"), async (ctx, next) => {
  const request = await ctx.prisma.request.findUnique({
    where: {
      id: ctx.session.notSubmittedRequestId,
    },
  });

  if (request?.amount) {
    await next();
  } else {
    const fromCurrency = request?.fromCurrency ?? " ";
    const toCurrency = request?.toCurrency ?? " ";
    const fromWallet = ctx.t("request.from-wallet-required", { fromCurrency });
    const amount = Number(ctx.message.text);
    await ctx.reply(
      ctx.t("request.text", {
        toCurrency,
        fromCurrency,
        exchangeRate: 1320,
        fromWallet,
        amount,
      }),
    );
    await ctx.prisma.request.update({
      where: {
        id: ctx.session.notSubmittedRequestId,
      },
      data: {
        exchangeRate: 1,
        fromCurrency,
        amount,
      },
    });
  }
});

feature.hears(/.*/, logHandle("message-text"), async (ctx, next) => {
  const request = await ctx.prisma.request.findUnique({
    where: {
      id: ctx.session.notSubmittedRequestId,
    },
  });
  if (request?.fromCurrency && request?.amount && request.toCurrency) {
    const fromCurrency = request?.fromCurrency ?? " ";
    const toCurrency = request?.toCurrency ?? " ";
    const amount = Number(request?.amount ?? 0);
    const fromWallet = ctx.message.text ?? " ";
    const exchangeRate = request?.exchangeRate ?? 0;
    await ctx.reply(
      ctx.t("request.text", {
        toCurrency,
        fromCurrency,
        amount,
        fromWallet,
        exchangeRate,
      }),
      {
        reply_markup: new InlineKeyboard()
          .text(
            ctx.t("request.submit"),
            `submit:${ctx.session.notSubmittedRequestId}`,
          )
          .text(ctx.t("request.cancel"), "cancel"),
      },
    );
    await ctx.prisma.request.update({
      where: {
        id: ctx.session.notSubmittedRequestId,
      },
      data: {
        exchangeRate: 1,
        fromCurrency,
        amount,
        fromWallet,
      },
    });
  } else await next();
});

feature.callbackQuery(
  /submit:.*/i,
  logHandle("callback-query"),
  async (ctx) => {
    const requestId = ctx.callbackQuery.data.split(":")[1];
    const request = await ctx.prisma.request.findUnique({
      where: {
        id: requestId,
      },
    });
    const fromCurrency = request?.fromCurrency ?? " ";
    const toCurrency = request?.toCurrency ?? " ";
    const amount = Number(request?.amount ?? 0);
    const fromWallet = request?.fromWallet ?? " ";
    const exchangeRate = request?.exchangeRate ?? 0;
    if (request?.submittedAt) {
      await ctx.answerCallbackQuery({
        text: ctx.t("request.already-submitted"),
        show_alert: true,
      });
    } else {
      await ctx.prisma.request.update({
        where: {
          id: requestId,
        },
        data: {
          submittedAt: new Date(),
        },
      });
      await ctx.api.sendMessage(
        config.ADMINS_CHAT_ID,
        ctx.t("admins-group.submited-request-text", {
          toCurrency,
          fromCurrency,
          amount,
          fromWallet,
          exchangeRate,
        }),
        {},
      );
      await ctx.answerCallbackQuery({
        text: ctx.t("request.submitted"),
      });
    }
  },
);
feature.command("cancel", logHandle("command"), async (ctx) => {
  const requestId = ctx.session.notSubmittedRequestId;
  await ctx.prisma.request.delete({
    where: {
      id: requestId,
    },
  });
  ctx.session.notSubmittedRequestId = undefined;
  await ctx.reply(ctx.t("request.cancelled"));
});

feature.callbackQuery("cancel", logHandle("callback-query"), async (ctx) => {
  const requestId = ctx.session.notSubmittedRequestId;
  await ctx.prisma.request.delete({
    where: {
      id: requestId,
    },
  });
  ctx.session.notSubmittedRequestId = undefined;
  await ctx.answerCallbackQuery({
    text: ctx.t("request.cancelled"),
  });
});

export { composer as requestFeature };
