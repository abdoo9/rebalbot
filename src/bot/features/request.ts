import { Composer, InlineKeyboard } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { logger } from "#root/logger.js";
import { config } from "#root/config.js";
import { prisma } from "#root/prisma/index.js";
import { i18n } from "../i18n.js";
import { calculateFinalAmountAfterFee } from "../helpers/calculate-final-amount-after-fee.js";
import { generateShortId } from "../helpers/get-short-id.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");
const fromCurrenciesTranslationTexts = i18n.locales.map((locale) =>
  i18n.t(locale, "currency.from"),
);
const toCurrenciesTranslationText = i18n.locales.map((locale) =>
  i18n.t(locale, "currency.to"),
);
const exchangeRates = await prisma.exchangeRate.findMany({
  select: {
    from: true,
    to: true,
  },
});

const fromCurrencies: string[] = [];
const toCurrencies: string[] = [];

// eslint-disable-next-line no-restricted-syntax
for (const rate of exchangeRates) {
  fromCurrencies.push(rate.from);
  toCurrencies.push(rate.to);
}
const fromCurrencyRegex = new RegExp(
  fromCurrenciesTranslationTexts.join("|"),
  "i",
);
const toCurrencyRegex = new RegExp(toCurrenciesTranslationText.join("|"), "i");

feature
  .filter(
    (ctx) =>
      !!ctx.message?.reply_markup?.inline_keyboard[0][0].text.match(
        fromCurrencyRegex,
      ),
  )
  .on(
    "message:sticker",
    logHandle("message-sticker-from-currency"),
    async (ctx) => {
      const fromCurrency = ctx.message.reply_markup?.inline_keyboard[0][0].text
        .split(":")[1]
        .trim();
      if (fromCurrency && fromCurrencies.includes(fromCurrency)) {
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
        ctx.session.notSubmittedRequestId = undefined;

        const requestMessage = await ctx.reply(`you picked ${fromCurrency}`, {
          reply_markup: new InlineKeyboard().switchInlineCurrent(
            ctx.t("request.choose-to-currency"),
            "📥$",
          ),
        });
        const request = await ctx.prisma.request.create({
          data: {
            id: generateShortId(),
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
      } else {
        await ctx.reply(ctx.t("request.invalid-sticker"));
      }
    },
  );

feature
  .filter(
    (ctx) =>
      !!ctx.message?.reply_markup?.inline_keyboard[0][0].text.match(
        toCurrencyRegex,
      ),
  )
  .on(
    "message:sticker",
    logHandle("message-sticker-tocurrency"),
    async (ctx) => {
      const toCurrency = ctx.message.reply_markup?.inline_keyboard[0][0].text
        .split(":")[1]
        .trim();
      if (toCurrency && toCurrencies.includes(toCurrency)) {
        const request = await ctx.prisma.request.findUnique({
          where: {
            id: ctx.session.notSubmittedRequestId,
          },
        });
        const fromCurrency = request?.fromCurrency ?? "error";
        const { rate, fee } = (await ctx.prisma.exchangeRate.findFirst({
          where: {
            from: fromCurrency,
            to: toCurrency,
          },
        })) as { rate: number; fee: number };
        await ctx.reply(
          ctx.t("request.text", {
            fromCurrency,
            toCurrency,
            fromWallet: "not-provided",
            transactionId: "not-provided",
            finalAmount: "not-provided",
            userReceivingWallet: "not-provided",
            rate,
            fee,
            amount: ctx.t("request.amount-required", { fromCurrency }),
          }),
        );
        await ctx.prisma.request.update({
          where: {
            id: ctx.session.notSubmittedRequestId,
          },
          data: {
            toCurrency,
            fee,
            exchangeRate: rate,
          },
        });
      }
    },
  );

feature.hears(/\d+/, logHandle("message-amount"), async (ctx, next) => {
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
    const rate = request?.exchangeRate ?? 0;
    const fee = request?.fee ?? 0;

    const userReceivingWallet = ctx.t(
      "request.user-receiving-wallet-required",
      {
        toCurrency,
      },
    );
    const amount = Number(ctx.message.text);
    const finalAmount = calculateFinalAmountAfterFee(amount, rate, fee);
    await ctx.reply(
      ctx.t("request.text", {
        toCurrency,
        fromCurrency,
        rate,
        fee,
        finalAmount,
        fromWallet: "not-provided",
        userReceivingWallet,
        transactionId: "not-provided",
        amount,
      }),
    );
    await ctx.prisma.request.update({
      where: {
        id: ctx.session.notSubmittedRequestId,
      },
      data: {
        amount,
        finalAmount,
      },
    });
  }
});

feature.hears(
  /.*/,
  logHandle("message-user-reciving-wallet"),
  async (ctx, next) => {
    if (ctx.session.notSubmittedRequestId === undefined) await next();
    const request = await ctx.prisma.request.findUnique({
      where: {
        id: ctx.session.notSubmittedRequestId,
      },
    });

    if (request?.userReceivingWallet) {
      await next();
    } else {
      const fromCurrency = request?.fromCurrency ?? " ";
      const toCurrency = request?.toCurrency ?? " ";
      const rate = request?.exchangeRate ?? 0;
      const fee = request?.fee ?? 0;
      const fromWallet = ctx.t("request.from-wallet-required", {
        fromCurrency,
      });

      const amount = request?.amount ?? 0;
      const userReceivingWallet = ctx.message.text ?? " ";
      const finalAmount = calculateFinalAmountAfterFee(amount, rate, fee);
      await ctx.reply(
        ctx.t("request.text", {
          toCurrency,
          fromCurrency,
          rate,
          fee,
          finalAmount,
          fromWallet,
          userReceivingWallet,
          transactionId: "not-provided",
          amount,
        }),
      );
      await ctx.prisma.request.update({
        where: {
          id: ctx.session.notSubmittedRequestId,
        },
        data: {
          userReceivingWallet,
        },
      });
    }
  },
);

feature.hears(
  /.*/,
  logHandle("message-text-from-wallet"),
  async (ctx, next) => {
    const request = await ctx.prisma.request.findUnique({
      where: {
        id: ctx.session.notSubmittedRequestId,
      },
    });
    if (
      request &&
      request?.fromCurrency &&
      request?.amount &&
      request.toCurrency &&
      request?.userReceivingWallet &&
      !request.fromWallet
    ) {
      const fromCurrency = request?.fromCurrency ?? " ";
      const toCurrency = request?.toCurrency ?? " ";
      const amount = Number(request?.amount ?? 0);
      const rate = request?.exchangeRate ?? 0;
      const fee = request?.fee ?? 0;
      const finalAmount = request?.finalAmount ?? 0;
      const userReceivingWallet = request?.userReceivingWallet ?? " ";
      const databaseCurrency = await ctx.prisma.currency.findFirst({
        where: {
          currency: toCurrency,
        },
      });
      const adminWallet = databaseCurrency?.adminWallet ?? " ";
      const fromWallet = ctx.message.text ?? " ";
      await ctx.reply(
        ctx.t("request.transaction-id-required", {
          toCurrency,
          fromCurrency,
          amount,
          rate,
          fee,
          finalAmount,
          fromWallet,
          adminWallet,
          userReceivingWallet,
          transactionId: "not-provided",
        }),
      );
      await ctx.prisma.request.update({
        where: {
          id: ctx.session.notSubmittedRequestId,
        },
        data: {
          fromWallet,
        },
      });
    } else await next();
  },
);

feature.hears(
  /.*/,
  logHandle("message-text-transaction-id"),
  async (ctx, next) => {
    const request = await ctx.prisma.request.findUnique({
      where: {
        id: ctx.session.notSubmittedRequestId,
      },
    });
    if (
      request &&
      request?.fromCurrency &&
      request?.amount &&
      request.toCurrency &&
      request.fromWallet
    ) {
      const fromCurrency = request?.fromCurrency ?? " ";
      const toCurrency = request?.toCurrency ?? " ";
      const amount = Number(request?.amount ?? 0);
      const rate = request?.exchangeRate ?? 0;
      const fee = request?.fee ?? 0;
      const finalAmount = request?.finalAmount ?? 0;
      const fromWallet = request.fromWallet ?? " ";
      const transactionId = ctx.message.text ?? " ";
      const userReceivingWallet = request?.userReceivingWallet ?? " ";
      await ctx.reply(
        ctx.t("request.photo-required", {
          toCurrency,
          fromCurrency,
          amount,
          fromWallet,
          transactionId,
          fee,
          rate,
          finalAmount,
          userReceivingWallet,
        }),
      );
      await ctx.prisma.request.update({
        where: {
          id: ctx.session.notSubmittedRequestId,
        },
        data: {
          transactionId,
        },
      });
    } else await next();
  },
);

feature.on("message:photo", logHandle("message-photo"), async (ctx, next) => {
  const request = await ctx.prisma.request.findUnique({
    where: {
      id: ctx.session.notSubmittedRequestId,
    },
  });
  if (
    request?.fromCurrency &&
    request?.amount &&
    request.toCurrency &&
    request.fromWallet
  ) {
    const fromCurrency = request?.fromCurrency ?? " ";
    const toCurrency = request?.toCurrency ?? " ";
    const amount = Number(request?.amount ?? 0);
    const rate = request?.exchangeRate ?? 0;
    const fee = request?.fee ?? 0;
    const finalAmount = request?.finalAmount ?? 0;
    const fromWallet = request.fromWallet ?? " ";
    const transactionId = request.transactionId ?? " ";
    const userReceivingWallet = request?.userReceivingWallet ?? " ";
    const photoId = ctx.message.photo[0].file_id;
    await ctx.replyWithPhoto(photoId, {
      caption: ctx.t("request.text", {
        toCurrency,
        fromCurrency,
        amount,
        fromWallet,
        rate,
        fee,
        finalAmount,
        userReceivingWallet,
        transactionId,
      }),
      reply_markup: new InlineKeyboard()
        .text(
          ctx.t("request.submit"),
          `submit:${ctx.session.notSubmittedRequestId}`,
        )
        .text(ctx.t("request.cancel"), "cancel"),
    });
    await ctx.prisma.request.update({
      where: {
        id: ctx.session.notSubmittedRequestId,
      },
      data: {
        photoId,
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
    const photoId = request?.photoId ?? " ";
    const rate = request?.exchangeRate ?? 0;
    const fee = request?.fee ?? 0;
    const finalAmount = request?.finalAmount ?? 0;
    const userReceivingWallet = request?.userReceivingWallet ?? " ";
    const transactionId = request?.transactionId ?? " ";
    const databaseCurrency = await ctx.prisma.currency.findFirst({
      where: {
        currency: toCurrency,
      },
    });
    const adminWallet = databaseCurrency?.adminWallet ?? " ";
    if (request?.submittedAt) {
      await ctx.answerCallbackQuery({
        text: ctx.t("request.already-submitted"),
        show_alert: true,
      });
    } else {
      await ctx.prisma.request
        .update({
          where: {
            id: requestId,
          },
          data: {
            submittedAt: new Date(),
          },
        })
        .then(() => {
          ctx.callbackQuery.message
            ?.editReplyMarkup({ inline_keyboard: [] })
            .catch((error) => {
              logger.error(error);
            });
          ctx.editMessageCaption({
            caption: ctx.t("request.submited-request-text", {
              requestId,
              toCurrency,
              fromCurrency,
              amount,
              fromWallet,
              transactionId,
              rate,
              fee,
              finalAmount,
              userReceivingWallet,
              adminWallet,
            }),
          });
        });
      await ctx.api.sendPhoto(config.ADMINS_CHAT_ID, photoId, {
        caption: ctx.t("admins-group.submited-request-text", {
          requestId,
          toCurrency,
          fromCurrency,
          amount,
          fromWallet,
          transactionId,
          rate,
          fee,
          finalAmount,
          userReceivingWallet,
          adminWallet,
        }),
      });
      await ctx.answerCallbackQuery({
        text: ctx.t("request.submitted"),
      });
      await ctx.message?.editReplyMarkup({
        inline_keyboard: [
          [
            {
              text: ctx.t("request.submitted"),
              callback_data: "alert_request_submitted",
            },
          ],
        ],
      });
    }
  },
);
feature.command("cancel", logHandle("command"), async (ctx) => {
  const requestId = ctx.session.notSubmittedRequestId;
  if (requestId !== undefined) {
    await ctx.prisma.request.delete({
      where: {
        id: requestId,
      },
    });
    ctx.session.notSubmittedRequestId = undefined;
  }
  await ctx.reply(ctx.t("request.cancelled"));
  await ctx.deleteMessage();
});

feature.callbackQuery("cancel", logHandle("callback-query"), async (ctx) => {
  const requestId = ctx.session.notSubmittedRequestId;
  if (requestId !== undefined) {
    await ctx.prisma.request.delete({
      where: {
        id: requestId,
      },
    });
    ctx.session.notSubmittedRequestId = undefined;
  }
  await ctx.answerCallbackQuery({
    text: ctx.t("request.cancelled"),
  });
  await ctx.deleteMessage();
});

export { composer as requestFeature };
