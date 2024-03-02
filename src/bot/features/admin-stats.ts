/* eslint-disable unicorn/no-array-reduce */
import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { config } from "#root/config.js";
import { Prisma } from "@prisma/client";

type Stat = Prisma.PickEnumerable<
  Prisma.AdminTransactionGroupByOutputType,
  ("description" | "telegramId")[]
> & { _count: { id: number } };

const composer = new Composer<Context>();

const feature = composer.filter((ctx) => {
  return Number(ctx.chat?.id) === config.ADMINS_CHAT_ID;
});

feature.command(
  "admin_stats_24h",
  logHandle("command-admin-stats"),
  async (ctx) => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = await ctx.prisma.adminTransaction.groupBy({
      by: ["telegramId", "description"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    const groupedStats: { [key: string]: Stat[] } = stats.reduce(
      (accumulator, stat) => {
        const telegramId = String(stat.telegramId); // Convert bigint to string
        if (!accumulator[telegramId]) {
          accumulator[telegramId] = [];
        }
        accumulator[telegramId].push(stat);
        return accumulator;
      },
      {} as { [key: string]: Stat[] },
    );

    const message = Object.entries(groupedStats)
      .map(([telegramId, innerStats]) => {
        const statsMessage = innerStats
          .map((stat) => `${stat.description}: ${stat._count.id}`)
          .join("\n");
        return `Admin ID: <a href="tg://user?id=${telegramId}">${telegramId}</a>\n${statsMessage}`;
      })
      .join("\n\n");

    ctx.reply(message, {
      parse_mode: "HTML",
    });
  },
);
feature.command(
  "admin_stats_week",
  logHandle("command-admin-stats"),
  async (ctx) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = await ctx.prisma.adminTransaction.groupBy({
      by: ["telegramId", "description"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    const groupedStats: { [key: string]: Stat[] } = stats.reduce(
      (accumulator, stat) => {
        const telegramId = String(stat.telegramId); // Convert bigint to string
        if (!accumulator[telegramId]) {
          accumulator[telegramId] = [];
        }
        accumulator[telegramId].push(stat);
        return accumulator;
      },
      {} as { [key: string]: Stat[] },
    );

    const message = Object.entries(groupedStats)
      .map(([telegramId, innerStats]) => {
        const statsMessage = innerStats
          .map((stat) => `${stat.description}: ${stat._count.id}`)
          .join("\n");
        return `Admin ID: <a href="tg://user?id=${telegramId}">${telegramId}</a>\n${statsMessage}`;
      })
      .join("\n\n");

    ctx.reply(message, {
      parse_mode: "HTML",
    });
  },
);

feature.command(
  "admin_stats_month",
  logHandle("command-admin-stats"),
  async (ctx) => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = await ctx.prisma.adminTransaction.groupBy({
      by: ["telegramId", "description"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      where: {
        createdAt: {
          gte: oneMonthAgo,
        },
      },
    });

    const groupedStats: { [key: string]: Stat[] } = stats.reduce(
      (accumulator, stat) => {
        const telegramId = String(stat.telegramId); // Convert bigint to string
        if (!accumulator[telegramId]) {
          accumulator[telegramId] = [];
        }
        accumulator[telegramId].push(stat);
        return accumulator;
      },
      {} as { [key: string]: Stat[] },
    );

    const message = Object.entries(groupedStats)
      .map(([telegramId, innerStats]) => {
        const statsMessage = innerStats
          .map((stat) => `${stat.description}: ${stat._count.id}`)
          .join("\n");
        return `Admin ID: <a href="tg://user?id=${telegramId}">${telegramId}</a>\n${statsMessage}`;
      })
      .join("\n\n");

    ctx.reply(message, {
      parse_mode: "HTML",
    });
  },
);

feature.command(
  "admin_stats_all",
  logHandle("command-admin-all-stats"),
  async (ctx) => {
    const stats = await ctx.prisma.adminTransaction.groupBy({
      by: ["telegramId", "description"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    const groupedStats: { [key: string]: Stat[] } = stats.reduce(
      (accumulator, stat) => {
        const telegramId = String(stat.telegramId); // Convert bigint to string
        if (!accumulator[telegramId]) {
          accumulator[telegramId] = [];
        }
        accumulator[telegramId].push(stat);
        return accumulator;
      },
      {} as { [key: string]: Stat[] },
    );

    const message = Object.entries(groupedStats)
      .map(([telegramId, innerStats]) => {
        const statsMessage = innerStats
          .map((stat) => `${stat.description}: ${stat._count.id}`)
          .join("\n");
        return `Admin ID: <a href="tg://user?id=${telegramId}">${telegramId}</a>\n${statsMessage}`;
      })
      .join("\n\n");

    ctx.reply(message, {
      parse_mode: "HTML",
    });
  },
);
export { composer as adminStatsFeature };
