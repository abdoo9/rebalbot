import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";

const composer = new Composer<Context>();

const feature = composer.filter((ctx) => {
  return Number(ctx.chat?.id) === config.EXCHANGE_RATE_CHANNEL_ID;
});

const regex =
  /from:\s*(?<from>.+)\nto:\s*(?<to>.+)\nrate:\s*(?<rate>.+)\nfee:\s*(?<fee>.+)/;
feature.on("channel_post:text", logHandle("command-channel"), async (ctx) => {
  const match = ctx.channelPost.text.match(regex);
  ctx.reply("I got it!");
  if (match?.groups) {
    const { from, to, rate, fee } = match.groups;
    ctx.reply(`from: ${from}\nto: ${to}\nrate: ${rate}\nfee: ${fee}`);
  }
});

export { composer as setRateFeature };
