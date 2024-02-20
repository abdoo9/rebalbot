import { autoChatAction } from "@grammyjs/auto-chat-action";
import { hydrate } from "@grammyjs/hydrate";
import { hydrateReply, parseMode } from "@grammyjs/parse-mode";
import { BotConfig, StorageAdapter, Bot as TelegramBot, session } from "grammy";
import { PrismaAdapter } from "@grammyjs/storage-prisma";
import {
  Context,
  SessionData,
  createContextConstructor,
} from "#root/bot/context.js";
import {
  adminFeature,
  languageFeature,
  unhandledFeature,
  welcomeFeature,
  inlineQueryFeature,
  requestFeature,
  setRateFeature,
  addExchangeFeature,
  deleteExchangeFeature,
  setCurrencyImageFeature,
  callbackQueryFeature,
  adminProvePayoutFeature,
  showTableFeature,
} from "#root/bot/features/index.js";
import { errorHandler } from "#root/bot/handlers/index.js";
import { i18n, isMultipleLocales } from "#root/bot/i18n.js";
import { updateLogger } from "#root/bot/middlewares/index.js";
import { config } from "#root/config.js";
import { logger } from "#root/logger.js";
import type { PrismaClientX } from "#root/prisma/index.js";

type Options = {
  prisma: PrismaClientX;
  sessionStorage?: StorageAdapter<SessionData>;
  config?: Omit<BotConfig<Context>, "ContextConstructor">;
};

export function createBot(token: string, options: Options) {
  const { prisma } = options;
  const bot = new TelegramBot(token, {
    ...options.config,
    ContextConstructor: createContextConstructor({ logger, prisma }),
  });
  const protectedBot = bot.errorBoundary(errorHandler);

  // Middlewares
  bot.api.config.use(parseMode("HTML"));

  if (config.isDev) {
    protectedBot.use(updateLogger());
  }

  protectedBot.use(autoChatAction(bot.api));
  protectedBot.use(hydrateReply);
  protectedBot.use(hydrate());
  protectedBot.use(
    session({
      initial: () => ({}),
      storage: new PrismaAdapter(prisma.session),
      getSessionKey: (ctx) => String(ctx.chat?.id ?? ctx.inlineQuery?.from?.id),
    }),
  );
  protectedBot.use(i18n);

  // Handlers
  if (isMultipleLocales) {
    protectedBot.use(languageFeature);
  }
  protectedBot.use(welcomeFeature);
  protectedBot.use(adminFeature);
  protectedBot.use(inlineQueryFeature);
  protectedBot.use(requestFeature);
  protectedBot.use(addExchangeFeature);
  protectedBot.use(deleteExchangeFeature);
  protectedBot.use(setCurrencyImageFeature);
  protectedBot.use(setRateFeature);
  protectedBot.use(callbackQueryFeature);
  protectedBot.use(adminProvePayoutFeature);
  protectedBot.use(showTableFeature);

  // must be the last handler
  protectedBot.use(unhandledFeature);

  return bot;
}

export type Bot = ReturnType<typeof createBot>;
