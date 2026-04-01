import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";

const getMemberDashboard = async (userId: string) => {
  // Validate user + membership
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
      member: {
        select: {
          id: true,
          status: true,
          joinedAt: true,
          isActive: true,
          membershipPayment: {
            select: { amount: true, currency: true, status: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, "User not found.", "NOT_FOUND");
  }

  const [
    myIdeas,
    totalVotes,
    totalComments,
    totalPurchases,
    totalWatchlists,
    revenueResult,
    recentIdeas,
    recentPurchases,
  ] = await Promise.all([
    // Ideas grouped by status
    prisma.idea.groupBy({
      by: ["status"],
      where: { authorId: userId },
      _count: { status: true },
    }),

    // Total votes the member has cast
    prisma.vote.count({ where: { userId } }),

    // Total non-deleted comments the member has posted
    prisma.comment.count({ where: { userId, isDeleted: false } }),

    // Total ideas this member has purchased
    prisma.ideaPurchase.count({ where: { userId } }),

    // Total watchlist entries
    prisma.watchlist.count({ where: { userId } }),

    // Revenue earned from paid idea purchases of THIS member's ideas
    prisma.ideaPurchase.aggregate({
      where: {
        idea: { authorId: userId },
      },
      _sum: { price: true },
    }),

    // 5 most recent ideas
    prisma.idea.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        accessType: true,
        price: true,
        createdAt: true,
        _count: { select: { votes: true, comments: true, purchases: true } },
      },
    }),

    // 5 most recent purchases made by this member
    prisma.ideaPurchase.findMany({
      where: { userId },
      orderBy: { purchasedAt: "desc" },
      take: 5,
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            slug: true,
            accessType: true,
            author: { select: { id: true, name: true, image: true } },
          },
        },
      },
    }),
  ]);

  // Normalize idea status counts into a map for easy chart use
  const ideaStatusMap: Record<string, number> = {
    DRAFT: 0,
    UNDER_REVIEW: 0,
    APPROVED: 0,
    REJECTED: 0,
  };
  for (const g of myIdeas) {
    ideaStatusMap[g.status] = g._count.status;
  }
  const totalIdeas = Object.values(ideaStatusMap).reduce((a, b) => a + b, 0);

  return {
    profile: user,

    // ── Summary KPIs ─────────────────────────────────────────────
    kpis: {
      totalIdeas,
      totalVotes,
      totalComments,
      totalPurchases,
      totalWatchlists,
      totalRevenueEarned: Number(revenueResult._sum.price ?? 0),
    },

    // ── Chart Data ────────────────────────────────────────────────
    charts: {
      ideaStatusBreakdown: [
        { label: "Draft", value: ideaStatusMap.DRAFT, color: "#94a3b8" },
        {
          label: "Under Review",
          value: ideaStatusMap.UNDER_REVIEW,
          color: "#f59e0b",
        },
        { label: "Approved", value: ideaStatusMap.APPROVED, color: "#22c55e" },
        {
          label: "Rejected",
          value: ideaStatusMap.REJECTED,
          color: "#ef4444",
        },
      ],
    },

    // ── Recent Activity ───────────────────────────────────────────
    recentIdeas,
    recentPurchases,
  };
};

export const memberService = {
  getMemberDashboard,
};
