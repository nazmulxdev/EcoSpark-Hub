import {
  IdeaStatus,
  MemberStatus,
  PaymentStatus,
  Role,
  UserStatus,
} from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import {
  IChangeIdeaStatus,
  IChangeMemberStatus,
  IChangeUserStatus,
} from "./admin.interface";

const getDashboardStats = async () => {
  const [
    totalUsers,
    activeUsers,
    bannedUsers,
    totalMembers,
    pendingMembers,
    approvedMembers,
    rejectedMembers,
    totalIdeas,
    draftIdeas,
    underReviewIdeas,
    approvedIdeas,
    rejectedIdeas,
    totalVotes,
    totalComments,
    membershipRevenue,
    ideaRevenue,
    recentPendingMembers,
    recentUnderReviewIdeas,
    topIdeasByVotes,
    monthlyMembershipRevenue,
    monthlyIdeaRevenue,
    ideaAccessTypeBreakdown,
  ] = await Promise.all([
    // User counts
    prisma.user.count(),
    prisma.user.count({ where: { userStatus: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { userStatus: UserStatus.BANNED } }),

    // Member counts
    prisma.member.count(),
    prisma.member.count({ where: { status: MemberStatus.PENDING } }),
    prisma.member.count({ where: { status: MemberStatus.APPROVED } }),
    prisma.member.count({ where: { status: MemberStatus.REJECTED } }),

    // Idea counts
    prisma.idea.count(),
    prisma.idea.count({ where: { status: IdeaStatus.DRAFT } }),
    prisma.idea.count({ where: { status: IdeaStatus.UNDER_REVIEW } }),
    prisma.idea.count({ where: { status: IdeaStatus.APPROVED } }),
    prisma.idea.count({ where: { status: IdeaStatus.REJECTED } }),

    // Engagement
    prisma.vote.count(),
    prisma.comment.count({ where: { isDeleted: false } }),

    // Revenue: membership payments (PAID)
    prisma.membershipPayment.aggregate({
      _sum: { amount: true },
      where: { status: PaymentStatus.PAID },
    }),

    // Revenue: idea payments (PAID)
    prisma.ideaPayment.aggregate({
      _sum: { amount: true },
      where: { status: PaymentStatus.PAID },
    }),

    // Recent actionable: 6 most recent PENDING members
    prisma.member.findMany({
      where: { status: MemberStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
        membershipPayment: {
          select: {
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }),

    // Recent actionable: 6 most recent UNDER_REVIEW ideas
    prisma.idea.findMany({
      where: { status: IdeaStatus.UNDER_REVIEW },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        author: { select: { id: true, name: true, email: true, image: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { votes: true, comments: true } },
      },
    }),

    // Top 5 ideas by votes (for engagement chart)
    prisma.idea.findMany({
      where: { status: IdeaStatus.APPROVED },
      orderBy: { votes: { _count: "desc" } },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        _count: { select: { votes: true, comments: true, purchases: true } },
      },
    }),

    // Monthly membership revenue for line chart (last 6 months)
    prisma.$queryRaw<Array<{ month: string; revenue: number }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
        SUM(amount) AS revenue
      FROM membership_payments
      WHERE status = 'PAID'
        AND "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `,

    // Monthly idea revenue for line chart (last 6 months)
    prisma.$queryRaw<Array<{ month: string; revenue: number }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
        SUM(amount) AS revenue
      FROM idea_payments
      WHERE status = 'PAID'
        AND "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `,

    // Idea access type breakdown for pie chart
    prisma.idea.groupBy({
      by: ["accessType"],
      _count: { accessType: true },
    }),
  ]);

  const membershipRevenueTotal = Number(membershipRevenue._sum.amount ?? 0);
  const ideaRevenueTotal = Number(ideaRevenue._sum.amount ?? 0);
  const totalRevenue = membershipRevenueTotal + ideaRevenueTotal;

  return {
    // ── Summary KPIs ──────────────────────────────────────────────
    kpis: {
      totalUsers,
      totalMembers,
      totalIdeas,
      totalVotes,
      totalComments,
      totalRevenue,
      membershipRevenue: membershipRevenueTotal,
      ideaRevenue: ideaRevenueTotal,
    },

    // ── Pie/Donut Chart Data ───────────────────────────────────────
    charts: {
      // Who are our users? User status breakdown
      userStatusBreakdown: [
        { label: "Active", value: activeUsers, color: "#22c55e" },
        { label: "Banned", value: bannedUsers, color: "#ef4444" },
      ],

      // Member application pipeline
      memberStatusBreakdown: [
        { label: "Pending", value: pendingMembers, color: "#f59e0b" },
        { label: "Approved", value: approvedMembers, color: "#22c55e" },
        { label: "Rejected", value: rejectedMembers, color: "#ef4444" },
      ],

      // Idea moderation funnel
      ideaStatusBreakdown: [
        { label: "Draft", value: draftIdeas, color: "#94a3b8" },
        { label: "Under Review", value: underReviewIdeas, color: "#f59e0b" },
        { label: "Approved", value: approvedIdeas, color: "#22c55e" },
        { label: "Rejected", value: rejectedIdeas, color: "#ef4444" },
      ],

      // Idea access type breakdown
      ideaAccessTypeBreakdown: ideaAccessTypeBreakdown.map((item) => ({
        label: item.accessType,
        value: item._count.accessType,
      })),

      // Revenue split for pie chart
      revenueBreakdown: [
        {
          label: "Membership Revenue",
          value: membershipRevenueTotal,
          color: "#6366f1",
        },
        {
          label: "Idea Revenue",
          value: ideaRevenueTotal,
          color: "#0ea5e9",
        },
      ],

      // Monthly revenue trend (last 6 months) for line/bar chart
      monthlyRevenueTrend: monthlyMembershipRevenue.map((m) => {
        const ideaEntry = monthlyIdeaRevenue.find((i) => i.month === m.month);
        return {
          month: m.month,
          membershipRevenue: Number(m.revenue),
          ideaRevenue: Number(ideaEntry?.revenue ?? 0),
          totalRevenue: Number(m.revenue) + Number(ideaEntry?.revenue ?? 0),
        };
      }),

      // Top ideas engagement for bar chart
      topIdeasByEngagement: topIdeasByVotes.map((idea) => ({
        title:
          idea.title.length > 30 ? idea.title.slice(0, 30) + "…" : idea.title,
        slug: idea.slug,
        votes: idea._count.votes,
        comments: idea._count.comments,
        purchases: idea._count.purchases,
      })),
    },

    // ── Actionable Queues ─────────────────────────────────────────
    pendingMemberApplications: recentPendingMembers,
    underReviewIdeas: recentUnderReviewIdeas,
  };
};

const changeUserStatus = async (userId: string, payload: IChangeUserStatus) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, "User not found.", "NOT_FOUND", [
      { field: "userId", message: "No user exists with this ID." },
    ]);
  }

  if (user.role === Role.ADMIN) {
    throw new AppError(
      403,
      "Cannot change the status of an admin account.",
      "FORBIDDEN",
    );
  }

  if (user.userStatus === payload.userStatus) {
    throw new AppError(
      400,
      `User is already ${payload.userStatus.toLowerCase()}.`,
      "NO_CHANGE",
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { userStatus: payload.userStatus },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      userStatus: true,
      updatedAt: true,
    },
  });

  return updated;
};

const changeMemberStatus = async (
  memberId: string,
  payload: IChangeMemberStatus,
) => {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      membershipPayment: { select: { status: true } },
    },
  });

  if (!member) {
    throw new AppError(404, "Member record not found.", "NOT_FOUND", [
      { field: "memberId", message: "No member exists with this ID." },
    ]);
  }

  // Guard: only allow approving if the membership payment is PAID
  if (
    payload.status === MemberStatus.APPROVED &&
    member.membershipPayment.status !== PaymentStatus.PAID
  ) {
    throw new AppError(
      400,
      "Cannot approve membership — payment has not been completed.",
      "PAYMENT_NOT_COMPLETED",
      [
        {
          field: "paymentStatus",
          message: "The associated membership payment must be in PAID status.",
        },
      ],
    );
  }

  if (member.status === payload.status) {
    throw new AppError(
      400,
      `Member is already in ${payload.status} status.`,
      "NO_CHANGE",
    );
  }

  // Use a transaction to ensure Member + User role update are atomic
  const result = await prisma.$transaction(async (tx) => {
    const updatedMember = await tx.member.update({
      where: { id: memberId },
      data: {
        status: payload.status,
        isActive: payload.status === MemberStatus.APPROVED,
        ...(payload.status === MemberStatus.APPROVED
          ? { joinedAt: new Date() }
          : {}),
      },
    });

    // Promote user role when approved, revert when rejected/pending
    const newRole =
      payload.status === MemberStatus.APPROVED ? Role.MEMBER : Role.USER;

    await tx.user.update({
      where: { id: member.userId },
      data: { role: newRole },
    });

    return updatedMember;
  });

  return result;
};

const changeIdeaStatus = async (slug: string, payload: IChangeIdeaStatus) => {
  const idea = await prisma.idea.findUnique({ where: { slug } });

  if (!idea) {
    throw new AppError(404, "Idea not found.", "NOT_FOUND", [
      { field: "slug", message: "No idea exists with this slug." },
    ]);
  }

  if (idea.status === payload.status) {
    throw new AppError(
      400,
      `Idea is already in ${payload.status} status.`,
      "NO_CHANGE",
    );
  }

  const updated = await prisma.idea.update({
    where: { slug },
    data: {
      status: payload.status,
      rejectionFeedback:
        payload.status === IdeaStatus.REJECTED
          ? (payload.rejectionFeedback ?? null)
          : null,
      publishedAt: payload.status === IdeaStatus.APPROVED ? new Date() : null,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      rejectionFeedback: true,
      publishedAt: true,
      updatedAt: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return updated;
};

const getAllUsers = async () => {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      userStatus: true,
      createdAt: true,
      member: {
        select: { id: true, status: true, joinedAt: true },
      },
    },
  });
};

const getAllMembers = async () => {
  return prisma.member.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          userStatus: true,
        },
      },
      membershipPayment: {
        select: { amount: true, currency: true, status: true, createdAt: true },
      },
    },
  });
};

const getAllIdeasForAdmin = async () => {
  return prisma.idea.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, email: true, image: true } },
      category: { select: { id: true, name: true } },
      _count: { select: { votes: true, comments: true, purchases: true } },
    },
  });
};

export const adminService = {
  getDashboardStats,
  changeUserStatus,
  changeMemberStatus,
  changeIdeaStatus,
  getAllUsers,
  getAllMembers,
  getAllIdeasForAdmin,
};
