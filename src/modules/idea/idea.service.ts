import { config } from "../../config/env";
import { stripe } from "../../config/stripe.config";
import { PaymentStatus } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { ideaUtils } from "./idea.utils";

// ── 1. purchaseIdea — direct purchase ─────────────────────────────────────────
const purchaseIdea = async (userId: string, ideaId: string) => {
  const { idea } = await ideaUtils.validateUserAndIdea(userId, ideaId);

  const existingPayment = await ideaUtils.checkExistingPayment(userId, ideaId);

  if (existingPayment) {
    if (existingPayment.status === PaymentStatus.PENDING) {
      throw new AppError(
        400,
        "You already have a pending payment for this idea.",
        "PAYMENT_PENDING",
        [
          {
            field: "ideaId",
            message: "Use initiate-payment to complete your existing payment.",
          },
        ],
      );
    }
    if (existingPayment.status === PaymentStatus.UNPAID) {
      throw new AppError(
        400,
        "You already have an unpaid payment record for this idea.",
        "PAYMENT_EXISTS",
        [
          {
            field: "ideaId",
            message: "Use initiate-payment to complete your payment.",
          },
        ],
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // Create payment record
    const payment = await tx.ideaPayment.create({
      data: {
        userId,
        ideaId,
        amount: idea.price!,
        currency: "USD",
        status: PaymentStatus.UNPAID,
      },
    });

    // Create Stripe session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: idea.title,
              description: idea.description.slice(0, 200),
            },
            unit_amount: Math.round(Number(idea.price) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${config.FRONTEND_URL}/ideas/${idea.slug}?payment_id=${payment.id}&status=success`,
      cancel_url: `${config.FRONTEND_URL}/ideas/${idea.slug}?status=cancelled`,
      metadata: {
        userId,
        ideaId,
        paymentId: payment.id,
        type: "idea_purchase", // ← used by webhook router
      },
    });

    // Save session ID → PENDING
    const updatedPayment = await tx.ideaPayment.update({
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
  });

  return result;
};

// ── 2. purchaseIdeaWithPayLater — save intent, pay later ──────────────────────
const purchaseIdeaWithPayLater = async (userId: string, ideaId: string) => {
  const { idea } = await ideaUtils.validateUserAndIdea(userId, ideaId);

  const existingPayment = await ideaUtils.checkExistingPayment(userId, ideaId);

  if (existingPayment) {
    throw new AppError(
      400,
      "You already have a payment record for this idea.",
      "PAYMENT_EXISTS",
      [
        {
          field: "ideaId",
          message: "Use initiate-payment to complete your payment.",
        },
      ],
    );
  }

  // Just create the payment record — no Stripe session yet
  const payment = await prisma.ideaPayment.create({
    data: {
      userId,
      ideaId,
      amount: idea.price!,
      currency: "USD",
      status: PaymentStatus.UNPAID,
    },
  });

  return { payment };
};

// ── 3. initiateIdeaPayment — start Stripe for pay-later ───────────────────────
const initiateIdeaPayment = async (userId: string, ideaId: string) => {
  const { idea } = await ideaUtils.validateUserAndIdea(userId, ideaId);

  const payment = await prisma.ideaPayment.findFirst({
    where: { userId, ideaId },
  });

  if (!payment) {
    throw new AppError(
      404,
      "No payment record found for this idea.",
      "NOT_FOUND",
      [
        {
          field: "ideaId",
          message:
            "Create a payment record first using purchase-with-pay-later.",
        },
      ],
    );
  }

  if (payment.status === PaymentStatus.PAID) {
    throw new AppError(
      400,
      "This idea has already been purchased.",
      "ALREADY_PURCHASED",
    );
  }

  // Create new Stripe session
  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: idea.title,
            description: idea.description.slice(0, 200),
          },
          unit_amount: Math.round(Number(idea.price) * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${config.FRONTEND_URL}/ideas/${idea.slug}?payment_id=${payment.id}&status=success`,
    cancel_url: `${config.FRONTEND_URL}/ideas/${idea.slug}?status=cancelled`,
    metadata: {
      userId,
      ideaId,
      paymentId: payment.id,
      type: "idea_purchase",
    },
  });

  // Save new session ID → PENDING
  const updatedPayment = await prisma.ideaPayment.update({
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

export const ideaService = {
  purchaseIdea,
  purchaseIdeaWithPayLater,
  initiateIdeaPayment,
};
