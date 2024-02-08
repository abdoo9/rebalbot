import { Composer, InlineKeyboard } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("start", logHandle("command-start"), async (ctx) => {
  await ctx.reply(ctx.t("welcome.text"), {
    reply_markup: new InlineKeyboard().switchInlineCurrent(
      ctx.t("welcome.choose-currency"),
      "$",
    ),
  });
});
export { composer as welcomeFeature };
