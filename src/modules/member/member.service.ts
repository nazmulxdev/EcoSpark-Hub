import { config } from "../../config/env";
import { stripe } from "../../config/stripe.config";
import { PaymentStatus } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { memberUtils } from "./member.utils";

const becomeMember = async (userId: string) => {
  await memberUtils.validateUserForMembership(userId);

  const isExistPayment = await prisma.membershipPayment.findUnique({
    where: {
      userId,
    },
  });

  if (isExistPayment) {
    if (isExistPayment.status === PaymentStatus.PAID) {
      throw new AppError(
        400,
        "Membership payment already completed.",
        "ALREADY_PAID",
      );
    }
    throw new AppError(
      400,
      "You already have a pending membership payment.",
      "PAYMENT_PENDING",
      [
        {
          field: "userId",
          message:
            "Use the initiate-payment endpoint to complete your payment.",
        },
      ],
    );
  }
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.membershipPayment.create({
      data: {
        userId,
        amount: Number(config.MEMBERSHIP_PRICE),
        currency: "USD",
        status: PaymentStatus.UNPAID,
      },
    });

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "EcoSpark Hub Membership" },
            unit_amount: Number(config.MEMBERSHIP_PRICE) * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${config.FRONTEND_URL}/dashboard/payment/payment-success?payment_id=${payment.id}`,
      cancel_url: `${config.FRONTEND_URL}/dashboard/payment/payment-failed`,
      metadata: {
        userId,
        paymentId: payment.id,
        type: "membership",
      },
    });

    const updatePayment = await tx.membershipPayment.update({
      where: {
        id: payment.id,
      },
      data: {
        stripeSessionId: stripeSession.id,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      payment: updatePayment,
      paymentUrl: stripeSession.url,
    };
  });
  return result;
};

const becomeMemberWithPayLater = async (userId: string) => {
  await memberUtils.validateUserForMembership(userId);

  // Check no existing payment
  const existingPayment = await prisma.membershipPayment.findUnique({
    where: { userId },
  });

  if (existingPayment) {
    throw new AppError(
      400,
      "You already have a membership payment record.",
      "PAYMENT_EXISTS",
      [{ field: "userId", message: "Use initiate-payment to complete it." }],
    );
  }

  const payment = await prisma.membershipPayment.create({
    data: {
      userId,
      amount: Number(config.MEMBERSHIP_PRICE),
      currency: "USD",
      status: PaymentStatus.UNPAID,
    },
  });

  return { payment };
};

const initiatePayment = async (userId: string) => {
  await memberUtils.validateUserForMembership(userId);

  const payment = await prisma.membershipPayment.findUnique({
    where: { userId },
  });

  if (!payment) {
    throw new AppError(404, "No pending payment found.", "NOT_FOUND", [
      { field: "userId", message: "No membership payment record found." },
    ]);
  }

  if (payment.status === PaymentStatus.PAID) {
    throw new AppError(
      400,
      "Membership payment already completed.",
      "ALREADY_PAID",
    );
  }

  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "EcoSpark Hub Membership" },
          unit_amount: Number(config.MEMBERSHIP_PRICE) * 100, // cents ✅
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${config.FRONTEND_URL}/dashboard/payment/payment-success?payment_id=${payment.id}`,
    cancel_url: `${config.FRONTEND_URL}/dashboard/payment/payment-failed`,
    metadata: {
      userId: payment.userId,
      paymentId: payment.id,
      type: "membership",
    },
  });

  // Save new session ID
  const updatedPayment = await prisma.membershipPayment.update({
    where: { id: payment.id },
    data: {
      stripeSessionId: stripeSession.id,
      status: PaymentStatus.PENDING,
    },
  });

  return {
    payment: updatedPayment,
    paymentUrl: stripeSession.url,
  };
};

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
  becomeMember,
  initiatePayment,
  becomeMemberWithPayLater,
  getMemberDashboard,
};
