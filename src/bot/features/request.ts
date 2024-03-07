/* eslint-disable unicorn/no-null */
/* eslint-disable no-irregular-whitespace */
import { Composer, InlineKeyboard } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { logger } from "#root/logger.js";
import { config } from "#root/config.js";
import { prisma } from "#root/prisma/index.js";
import { Prisma } from "@prisma/client";
import { i18n } from "../i18n.js";
import { calculateFinalAmountAfterFee } from "../helpers/calculate-final-amount-after-fee.js";
import { escapeHTML } from "../helpers/escape-html.js";
import { getTopicLink } from "../helpers/get-topic-link.js";
import { formatNumber } from "../helpers/format-number.js";
import { toHashtag } from "../helpers/to-hashtag.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

async function getFromCurrencies() {
  const exchangeRates = await prisma.exchangeRate.findMany({
    select: {
      from: true,
    },
  });

  const fromCurrencies: string[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const rate of exchangeRates) {
    fromCurrencies.push(rate.from);
  }

  return fromCurrencies;
}

async function getToCurrencies() {
  const exchangeRates = await prisma.exchangeRate.findMany({
    select: {
      to: true,
    },
  });

  const toCurrencies: string[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const rate of exchangeRates) {
    toCurrencies.push(rate.to);
  }

  return toCurrencies;
}

async function getFromCurrencyRegex() {
  const exchangeRates = await prisma.exchangeRate.findMany({
    select: {
      from: true,
    },
  });
  const fromCurrencies = await getFromCurrencies();
  // eslint-disable-next-line no-restricted-syntax
  for (const rate of exchangeRates) {
    // eslint-disable-next-line no-await-in-loop, unicorn/no-await-expression-member
    fromCurrencies.push(rate.from);
  }

  const fromCurrenciesTranslationTexts = i18n.locales.map((locale) =>
    i18n.t(locale, "currency.from"),
  );

  return new RegExp(fromCurrenciesTranslationTexts.join("|"), "i");
}

async function getToCurrencyRegex() {
  const exchangeRates = await prisma.exchangeRate.findMany({
    select: {
      to: true,
    },
  });
  const toCurrencies = await getToCurrencies();
  // eslint-disable-next-line no-restricted-syntax
  for (const rate of exchangeRates) {
    // eslint-disable-next-line no-await-in-loop, unicorn/no-await-expression-member
    toCurrencies.push(rate.to);
  }

  const toCurrenciesTranslationTexts = i18n.locales.map((locale) =>
    i18n.t(locale, "currency.to"),
  );

  return new RegExp(toCurrenciesTranslationTexts.join("|"), "i");
}

const updateRequest = async (ctx: Context, data: Prisma.RequestUpdateInput) => {
  await ctx.prisma.request.update({
    where: {
      id: ctx.session.notSubmittedRequestId,
    },
    data,
  });
};

const deleteNotSubmittedRequest = async (ctx: Context) => {
  const { count: deletedCount } = await ctx.prisma.request.deleteMany({
    where: {
      User: {
        telegramId: ctx.from?.id,
      },
      submittedAt: {
        equals: null,
      },
    },
  });
  logger.info(
    `deleted ${deletedCount} requests from database this shouldn't happen too often`,
  );
};

const initiateRequest = async (
  ctx: Context,
  data: Prisma.RequestCreateInput,
) => {
  const request = await ctx.prisma.request.create({ data });
  return request;
};

const getRequest = async (ctx: Context, id: number) => {
  const request = await ctx.prisma.request.findUnique({
    where: {
      id,
    },
  });
  return request;
};
feature
  .filter(
    async (ctx) =>
      !!ctx.message?.reply_markup?.inline_keyboard[0][0].text.match(
        await getFromCurrencyRegex(),
      ),
  )
  .on(
    "message:sticker",
    logHandle("message-sticker-from-currency"),
    async (ctx) => {
      const fromCurrency = ctx.message.reply_markup?.inline_keyboard[0][0].text
        .split(":")[1]
        .trim();
      const fromCurrencies = await getFromCurrencies();
      if (fromCurrency && fromCurrencies.includes(fromCurrency)) {
        await deleteNotSubmittedRequest(ctx);
        await ctx.reply(`you picked ${fromCurrency}`, {
          reply_markup: new InlineKeyboard().switchInlineCurrent(
            ctx.t("request.choose-to-currency"),
            `📥$:${fromCurrency}`,
          ),
        });
        const request = await initiateRequest(ctx, {
          User: {
            connect: {
              telegramId: ctx.from?.id,
            },
          },
          exchangeRate: 0,
          fromCurrency,
        });
        ctx.session.notSubmittedRequestId = request.id;
        ctx.session.state = "awaiting-to-currency";
        logger.info(`session requestId: ${JSON.stringify(ctx.session)}`);
      } else {
        await ctx.reply(ctx.t("request.invalid-sticker"));
      }
    },
  );

feature
  .filter(
    async (ctx) =>
      !!ctx.message?.reply_markup?.inline_keyboard[0][0].text.match(
        await getToCurrencyRegex(),
      ),
  )
  .on(
    "message:sticker",
    logHandle("message-sticker-tocurrency"),
    async (ctx, next) => {
      logger.info(`message-sticker-tocurrency: ${JSON.stringify(ctx.session)}`);
      const toCurrency = ctx.message.reply_markup?.inline_keyboard[0][0].text
        .split(":")[1]
        .trim();

      const toCurrencies = await getToCurrencies();
      if (
        toCurrency &&
        toCurrencies.includes(toCurrency) &&
        ctx.session.state === "awaiting-to-currency"
      ) {
        logger.info(`befor const request =: ${JSON.stringify(ctx.session)}`);
        const request = await getRequest(
          ctx,
          ctx.session.notSubmittedRequestId,
        ).catch(async (error) => {
          logger.error(error);
          await ctx.reply(ctx.t("request.error"));
        });
        if (!request) {
          await ctx.reply(ctx.t("request.error"));
          await next();
        }
        const fromCurrency = request?.fromCurrency ?? "error";
        const { rate, fee, feeThreshold } =
          (await ctx.prisma.exchangeRate.findFirst({
            where: {
              from: fromCurrency,
              to: toCurrency,
            },
          })) as { rate: number; fee: number; feeThreshold: number };
        await ctx.reply(
          ctx.t("request.text", {
            fromCurrency,
            toCurrency,
            transactionId: "not-provided",
            finalAmount: "not-provided",
            userReceivingWallet: "not-provided",
            rate: `${formatNumber(rate)} ​`,
            fee: `${formatNumber(fee)} ​`,
            amount: ctx.t("request.amount-required", { fromCurrency }),
          }),
        );
        await updateRequest(ctx, {
          toCurrency,
          exchangeRate: rate,
          fee,
          feeThreshold,
        });
        ctx.session.state = "awaiting-amount";
      } else {
        next();
      }
    },
  );

feature.hears(/\d+/, logHandle("message-amount"), async (ctx, next) => {
  const request = await getRequest(ctx, ctx.session.notSubmittedRequestId);

  if (request?.amount) {
    await next();
  } else if (
    request?.feeThreshold &&
    request?.exchangeRate &&
    request?.fee &&
    request?.toCurrency &&
    request?.fromCurrency &&
    ctx.session.state === "awaiting-amount"
  ) {
    const fromCurrency = request?.fromCurrency;
    const toCurrency = request?.toCurrency;
    const rate = request?.exchangeRate;
    const fee = request?.fee;
    const feeThreshold = request?.feeThreshold;

    const userReceivingWallet = ctx.t(
      "request.user-receiving-wallet-required",
      {
        toCurrency,
      },
    );
    const amount = Number(ctx.message.text);
    const finalAmount = calculateFinalAmountAfterFee(
      amount,
      rate,
      fee,
      feeThreshold,
    );
    await ctx.reply(
      ctx.t("request.text", {
        toCurrency,
        fromCurrency,
        rate: `${formatNumber(rate)} ​`,
        fee: `${formatNumber(fee)} ​`,
        finalAmount: `${formatNumber(finalAmount)} ​`,
        amount: `${formatNumber(amount)} ​`,
        userReceivingWallet,
        transactionId: "not-provided",
      }),
    );
    await updateRequest(ctx, {
      amount,
      finalAmount,
    });
    ctx.session.state = "awaiting-wallet";
  } else {
    await next();
  }
});

feature.hears(
  /.*/,
  logHandle("message-user-reciving-wallet"),
  async (ctx, next) => {
    if (ctx.session.notSubmittedRequestId === undefined) await next();
    const request = await getRequest(ctx, ctx.session.notSubmittedRequestId);

    if (request?.userReceivingWallet) {
      await next();
    } else if (
      request?.fromCurrency &&
      request?.amount &&
      request.toCurrency &&
      request?.exchangeRate &&
      request?.fee &&
      ctx.session.state === "awaiting-wallet"
    ) {
      const fromCurrency = request?.fromCurrency ?? " ";
      const toCurrency = request?.toCurrency ?? " ";
      const rate = request?.exchangeRate ?? 0;
      const fee = request?.fee ?? 0;
      const databaseCurrency = await ctx.prisma.currency.findFirst({
        where: {
          currency: fromCurrency,
        },
      });
      const adminWallet = databaseCurrency?.adminWallet ?? " ";

      const amount = request?.amount ?? 0;
      const finalAmount = request?.finalAmount ?? 0;
      const userReceivingWallet = ctx.message.text ?? " ";
      await ctx.reply(
        ctx.t("request.please-send-money-to-admin-wallet", {
          toCurrency,
          fromCurrency,
          rate: `${formatNumber(rate)} ​`,
          fee: `${formatNumber(fee)} ​`,
          finalAmount: `${formatNumber(finalAmount)} ​`,
          amount: `${formatNumber(amount)} ​`,
          adminWallet,
          userReceivingWallet,
          transactionId: "not-provided",
        }),
      );
      await updateRequest(ctx, {
        userReceivingWallet,
      });
      ctx.session.state = "awaiting-transaction-id";
    } else next();
  },
);

feature.hears(
  /.*/,
  logHandle("message-text-transaction-id"),
  async (ctx, next) => {
    const request = await getRequest(ctx, ctx.session.notSubmittedRequestId);
    if (
      request &&
      request?.fromCurrency &&
      request?.amount &&
      request.toCurrency &&
      ctx.session.state === "awaiting-transaction-id"
    ) {
      const fromCurrency = request?.fromCurrency ?? " ";
      const toCurrency = request?.toCurrency ?? " ";
      const amount = Number(request?.amount ?? 0);
      const rate = request?.exchangeRate ?? 0;
      const fee = request?.fee ?? 0;
      const finalAmount = request?.finalAmount ?? 0;
      const transactionId = ctx.message.text ?? " ";
      const userReceivingWallet = request?.userReceivingWallet ?? " ";
      await ctx.reply(
        ctx.t("request.photo-required", {
          toCurrency,
          fromCurrency,
          transactionId,
          rate: `${formatNumber(rate)} ​`,
          fee: `${formatNumber(fee)} ​`,
          finalAmount: `${formatNumber(finalAmount)} ​`,
          amount: `${formatNumber(amount)} ​`,
          userReceivingWallet,
        }),
      );
      await updateRequest(ctx, {
        transactionId,
      });
      ctx.session.state = "awaiting-proof-image";
    } else await next();
  },
);

feature.on("message:photo", logHandle("message-photo"), async (ctx, next) => {
  const request = await getRequest(ctx, ctx.session.notSubmittedRequestId);
  if (
    request?.fromCurrency &&
    request?.amount &&
    request.toCurrency &&
    ctx.session.state === "awaiting-proof-image"
  ) {
    const fromCurrency = request?.fromCurrency ?? " ";
    const toCurrency = request?.toCurrency ?? " ";
    const amount = Number(request?.amount ?? 0);
    const rate = request?.exchangeRate ?? 0;
    const fee = request?.fee ?? 0;
    const finalAmount = request?.finalAmount ?? 0;
    const transactionId = request.transactionId ?? " ";
    const userReceivingWallet = request?.userReceivingWallet ?? " ";
    const photoId = ctx.message.photo[0].file_id;
    await ctx.replyWithPhoto(photoId, {
      caption: ctx.t("request.text", {
        toCurrency,
        fromCurrency,
        rate: `${formatNumber(rate)} ​`,
        fee: `${formatNumber(fee)} ​`,
        finalAmount: `${formatNumber(finalAmount)} ​`,
        amount: `${formatNumber(amount)} ​`,
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
    await updateRequest(ctx, {
      photoId,
    });
    ctx.session.state = "idle";
  } else await next();
});

feature.callbackQuery(
  /submit:.*/i,
  logHandle("callback-query"),
  async (ctx) => {
    const requestId = ctx.callbackQuery.data.split(":")[1];
    const request = await getRequest(ctx, Number(requestId));
    const fromCurrency = request?.fromCurrency ?? " ";
    const toCurrency = request?.toCurrency ?? " ";
    const amount = Number(request?.amount ?? 0);
    const photoId = request?.photoId ?? " ";
    const rate = request?.exchangeRate ?? 0;
    const fee = request?.fee ?? 0;
    const finalAmount = request?.finalAmount ?? 0;
    const userReceivingWallet = request?.userReceivingWallet ?? " ";
    const transactionId = request?.transactionId ?? " ";
    const databaseCurrency = await ctx.prisma.currency.findFirst({
      where: {
        currency: fromCurrency,
      },
    });
    const adminWallet = databaseCurrency?.adminWallet ?? " ";
    if (request?.submittedAt) {
      await ctx.answerCallbackQuery({
        text: ctx.t("request.already-submitted"),
        show_alert: true,
      });
    } else {
      await updateRequest(ctx, {
        submittedAt: new Date(),
      }).then(() => {
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
            transactionId,
            rate: `${formatNumber(rate)} ​`,
            fee: `${formatNumber(fee)} ​`,
            finalAmount: `${formatNumber(finalAmount)} ​`,
            amount: `${formatNumber(amount)} ​`,
            userReceivingWallet,
            adminWallet,
          }),
        });
      });
      await ctx.api.sendPhoto(config.ADMINS_CHAT_ID, photoId, {
        caption: `<a href="https://t.me/${ctx.from?.id}">📇​</a>${ctx.t(
          "admins-group.submited-request-text",
          {
            requestId,
            userId: `${String(ctx.from?.id)} ​`,
            name: escapeHTML(
              `| ${ctx.from?.first_name} ${ctx.from?.last_name ?? ""}`,
            ),
            username: ctx.from?.username ?? "not-provided",
            toCurrency,
            fromCurrency,
            amount: `${formatNumber(amount)} ​`,
            transactionId,
            rate: `${formatNumber(rate)} ​`,
            fee: `${formatNumber(fee)} ​`,
            finalAmount: `${formatNumber(finalAmount)} ​`,
            userReceivingWallet,
            adminWallet,
            topicLink: getTopicLink(ctx.session.logTopicThreadId),
          },
        )} \n${toHashtag(`from ${fromCurrency}`)}\n${toHashtag(
          `to ${toCurrency}`,
        )}`,
        reply_markup: new InlineKeyboard([
          // [
          //   {
          //     text: ctx.t("request.admin-confirm-receipt"),
          //     callback_data: `adminConfirmedReceipt:${requestId}:${ctx.from?.id}`,
          //   },
          // ],
          [
            {
              text: "رد بصورة اثبات التحويل",
              callback_data: "_",
            },
          ],
          [
            {
              text: ctx.t("request.reject"),
              callback_data: `reject:${requestId}:${ctx.from?.id}`,
            },
          ],
        ]),
        message_thread_id:
          toCurrency === "zainCash"
            ? config.ADMINS_CHAT_ZAINCASH_REQUESTS_THREAD_ID
            : config.ADMINS_CHAT_PROCESSING_THREAD_ID,
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
    await deleteNotSubmittedRequest(ctx);
    ctx.session.notSubmittedRequestId = 0;
    ctx.session.state = "idle";
  }
  await ctx.reply(ctx.t("request.cancelled"));
  await ctx.deleteMessage();
});

feature.callbackQuery("cancel", logHandle("callback-query"), async (ctx) => {
  const requestId = ctx.session.notSubmittedRequestId;
  if (requestId !== undefined) {
    await deleteNotSubmittedRequest(ctx);
    ctx.session.notSubmittedRequestId = 0;
    ctx.session.state = "idle";
  }
  await ctx.answerCallbackQuery({
    text: ctx.t("request.cancelled"),
  });
  await ctx.deleteMessage();
});

export { composer as requestFeature };
