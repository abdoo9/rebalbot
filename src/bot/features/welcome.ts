import { Composer, InlineKeyboard, Keyboard } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");
feature.command("start", logHandle("command-start"), async (ctx, next) => {
  const userFromDatabase = await ctx.prisma.user.findUnique({
    where: {
      telegramId: ctx.from.id,
    },
  });
  await (userFromDatabase?.contact === undefined
    ? ctx.reply(ctx.t("welcome.add-contact"), {
        reply_markup: new Keyboard()
          .requestContact(ctx.t("welcome.add-contact-button"))
          .resized(),
      })
    : next());
});

feature.command("start", logHandle("command-start"), async (ctx) => {
  await ctx.reply(ctx.t("welcome.text"), {
    reply_markup: new InlineKeyboard().switchInlineCurrent(
      ctx.t("welcome.choose-currency"),
      "📤$",
    ),
  });
});

feature.on("msg:contact", logHandle("contact"), async (ctx) => {
  const _user = await ctx.prisma.user.upsert({
    where: { telegramId: ctx.from.id },
    update: { contact: ctx.message.contact.phone_number },
    create: {
      telegramId: ctx.from.id,
      contact: ctx.message.contact.phone_number,
    },
  });
  await ctx.reply(ctx.t("welcome.contact-saved"), {
    reply_markup: { remove_keyboard: true },
  });
});
export { composer as welcomeFeature };
