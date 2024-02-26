import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";
import { formatNumber } from "../helpers/format-number.js";
import { getUserIDFromTopicName } from "../helpers/get-user-id-from-topic-name.js";

const composer = new Composer<Context>();

const feature = composer.filter((ctx) => {
  return (
    Number(ctx.chat?.id) === config.LOG_GROUP_ID &&
    !!ctx.message?.text?.match("دفع جزئي")
  );
});

feature.on(
  "message:text",
  logHandle("command-partial payment"),
  async (ctx, next) => {
    const userId = getUserIDFromTopicName(ctx);
    if (!userId) return next();
    const match = ctx.message.text.match(/دفع جزئي\s*(?<amount>.+)/);

    if (match?.groups) {
      const { amount } = match.groups;
      const request = await ctx.prisma.request.findFirst({
        where: {
          User: {
            telegramId: Number(userId),
          },
        },
        orderBy: {
          submittedAt: "desc",
        },
      });
      if (!request) {
        await ctx.reply("لم يتم العثور على طلب قيد المعالجة");
        return;
      }
      const requestId = request?.id;
      const finalAmount = request?.finalAmount ?? 0; // the amount that the user should receive
      const adminPaymentsMade = request?.adminPaymentsMade ?? []; // now an array
      const newAdminPaidAmount = Number(amount);
      adminPaymentsMade.push(newAdminPaidAmount);

      const totalAdminPaidAmount = adminPaymentsMade.reduce((a, b) => a + b, 0);

      // Prepare a string of all payments
      const allPayments = adminPaymentsMade.join(", ");

      if (totalAdminPaidAmount === finalAmount) {
        await ctx.prisma.request.update({
          where: { id: Number(requestId) },
          data: {
            adminPaymentsMade,
          },
        });
        await ctx.reply(
          `تم الدفع بنجاح. الطلب رقم ${requestId} مكتمل الدفع. الدفعات التي تمت: ${allPayments}`,
        );
      } else if (totalAdminPaidAmount > finalAmount) {
        await ctx.reply(
          `المبلغ المدفوع أكبر من المبلغ المتبقي. الرجاء التأكد من المبلغ المدفوع. الدفعات التي تمت: ${allPayments}`,
        );
      } else {
        await ctx.prisma.request.update({
          where: { id: Number(requestId) },
          data: {
            adminPaymentsMade,
          },
        });
        const remainingAmount = finalAmount - totalAdminPaidAmount;
        const message = await ctx.reply(
          `تم الدفع بنجاح. الطلب رقم #${requestId} متبقي له ${formatNumber(
            remainingAmount,
          )}. الدفعات التي تمت: ${allPayments}`,
        );
        await ctx.api.sendMessage(
          userId,
          `تم الدفع بنجاح. الطلب رقم #${requestId} متبقي لك ${formatNumber(
            remainingAmount,
          )}. الدفعات التي تمت: ${allPayments}`,
        );
        await ctx.pinChatMessage(message.message_id);
      }
    }
  },
);
export { composer as partialPaymentFeature };
