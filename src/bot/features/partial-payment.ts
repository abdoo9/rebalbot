import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";
import { formatNumber } from "../helpers/format-number.js";

const composer = new Composer<Context>();

const feature = composer.filter((ctx) => {
  return (
    Number(ctx.chat?.id) === config.ADMINS_CHAT_ID &&
    !!ctx.message?.text?.match("دفع جزئي")
  );
});

feature.on(
  "message:text",
  logHandle("command-EXCHANGE_RATE-group"),
  async (ctx) => {
    const match = ctx.message.text.match(/دفع جزئي\s*(?<amount>.+)/);
    const button =
      ctx.message.reply_to_message?.reply_markup?.inline_keyboard[0][0];

    if (button && "callback_data" in button) {
      const requestId = button.callback_data.split(":")[1];
      if (match?.groups) {
        const { amount } = match.groups;
        const request = await ctx.prisma.request.findUnique({
          where: { id: Number(requestId) },
        });
        const finalAmount = request?.finalAmount ?? 0; // the amount that the user should receive
        const adminPaidAmount = request?.adminPaidAmount ?? 0;
        const newAdminPaidAmount = adminPaidAmount + Number(amount);

        if (newAdminPaidAmount === finalAmount) {
          await ctx.prisma.request.update({
            where: { id: Number(requestId) },
            data: {
              adminPaidAmount: newAdminPaidAmount,
            },
          });
          await ctx.reply(
            `تم الدفع بنجاح. الطلب رقم ${requestId} مكتمل الدفع.`,
          );
        } else if (newAdminPaidAmount > finalAmount) {
          await ctx.reply(
            `المبلغ المدفوع أكبر من المبلغ المتبقي. الرجاء التأكد من المبلغ المدفوع.`,
          );
        } else {
          await ctx.prisma.request.update({
            where: { id: Number(requestId) },
            data: {
              adminPaidAmount: newAdminPaidAmount,
            },
          });
          const remainingAmount = finalAmount - newAdminPaidAmount;
          await ctx.reply(
            `تم الدفع بنجاح. الطلب رقم #${requestId} متبقي له ${formatNumber(
              remainingAmount,
            )}.`,
          );
        }
      }
    }
  },
);

export { composer as partialPaymentFeature };
