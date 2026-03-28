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

export const memberService = {
  becomeMember,
  initiatePayment,
  becomeMemberWithPayLater,
};
