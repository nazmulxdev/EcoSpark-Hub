import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";

const getUserDashboard = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      userStatus: true,
      createdAt: true,
      membershipPayment: true,
      member: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found.", "NOT_FOUND");
  }

  const [
    totalVotes,
    totalComments,
    totalPurchases,
    totalWatchlist,
    recentPurchases,
    recentVotes,
    recentComments,
    recentWatchlist,
  ] = await Promise.all([
    prisma.vote.count({ where: { userId } }),
    prisma.comment.count({ where: { userId, isDeleted: false } }),
    prisma.ideaPurchase.count({ where: { userId } }),
    prisma.watchlist.count({ where: { userId } }),

    // Recent Purchases
    prisma.ideaPurchase.findMany({
      where: { userId },
      take: 5,
      orderBy: { purchasedAt: "desc" },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: true,
            price: true,
          },
        },
      },
    }),

    // Recent Votes
    prisma.vote.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        idea: {
          select: { id: true, title: true, slug: true, status: true },
        },
      },
    }),

    // Recent Comments
    prisma.comment.findMany({
      where: { userId, isDeleted: false },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        idea: {
          select: { id: true, title: true, slug: true },
        },
      },
    }),

    // Recent Watchlist
    prisma.watchlist.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            price: true,
            accessType: true,
          },
        },
      },
    }),
  ]);

  return {
    profile: user,
    stats: {
      totalVotes,
      totalComments,
      totalPurchases,
      totalWatchlist,
    },
    recentActivity: {
      purchases: recentPurchases,
      votes: recentVotes,
      comments: recentComments,
      watchlist: recentWatchlist,
    },
  };
};

export const userService = {
  getUserDashboard,
};
