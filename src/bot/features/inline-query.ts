import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { currencies } from "../helpers/currencies.js";

const composer = new Composer<Context>();
const feature = composer;

feature.inlineQuery("📤$", logHandle("inline-query-currency"), async (ctx) => {
  await ctx.answerInlineQuery(
    currencies.map((currency) => {
      return {
        type: "article",
        id: currency.name,
        title: currency.name,
        description: "ّ~~~",
        thumb_url: currency.image,
        input_message_content: {
          message_text: `${ctx.t("currency.from")} ${currency.name}`,
        },
      };
    }),
  );
});

feature.inlineQuery("📥$", logHandle("inline-query-currency"), async (ctx) => {
  await ctx.answerInlineQuery(
    currencies.map((currency) => {
      return {
        type: "article",
        id: currency.name,
        title: currency.name,
        description: "ّ~~~",
        thumb_url: currency.image,
        input_message_content: {
          message_text: `${ctx.t("currency.to")} ${currency.name}`,
        },
      };
    }),
  );
});
export { composer as inlineQueryFeature };
