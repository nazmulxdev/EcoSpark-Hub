import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import {
  MemberStatus,
  PaymentStatus,
} from "../../generated/prisma/enums";

const handleStripeWebhokEventForMembership = async (event: Stripe.Event) => {
  const existingPayment = await prisma.membershipPayment.findFirst({
    where: {
      stripeEventId: event.id,
    },
  });

  if (existingPayment) {
    console.log(`Event ${event.id} already exists. Skipping...`);
    return {
      success: false,
      message: "Event already exists",
    };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session?.metadata?.userId;
      const paymentId = session?.metadata?.paymentId;

      if (!userId || !paymentId) {
        console.log("Missing metadata in checkout.session.completed", {
          event,
        });
        return {
          success: false,
          message: "Missing metadata",
        };
      }

      if (session.payment_status !== "paid") {
        console.log("Payment not completed:", session.payment_status);
        return { success: false, message: "Payment not completed." };
      }

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        console.log("User not found", {
          event,
          userId,
        });
        return {
          success: false,
          message: "User not found",
        };
      }

      const payment = await prisma.membershipPayment.findFirst({
        where: {
          id: paymentId,
          userId,
        },
      });

      if (!payment) {
        console.log("Membership payment not found", {
          event,
          paymentId,
          userId,
        });
        return {
          success: false,
          message: "Membership payment not found",
        };
      }

      if (payment.status === PaymentStatus.PAID) {
        console.log("Payment already marked as PAID. Skipping.");
        return { success: true, message: "Already processed." };
      }

      try {
        await prisma.$transaction(async (tx) => {
          // Update payment record
          await tx.membershipPayment.update({
            where: { id: paymentId },
            data: {
              status: PaymentStatus.PAID,
              stripePaymentIntentId: session.payment_intent as string,
              stripeSessionId: session.id,
              stripeEventId: event.id,
              stripePaymentData: JSON.parse(JSON.stringify(session)),
            },
          });

          // The User role will NOT be updated here. It requires Admin approval.

          await tx.member.upsert({
            where: { userId },
            update: {
              status: MemberStatus.PENDING,
              joinedAt: new Date(),
              isActive: true,
            },
            create: {
              status: MemberStatus.PENDING,
              joinedAt: new Date(),
              isActive: true,
              userId,
              paymentId,
            },
          });
        });

        console.log(`Membership created for userId: ${userId}`);
        return { success: true, message: "Membership created successfully." };
      } catch (txError) {
        console.error("Transaction failed for membership creation:", txError);
        return { success: false, message: "Transaction failed." };
      }
    }
    case "checkout.session.expired": {
      const session = event.data.object;
      const paymentId = session?.metadata?.paymentId;
      if (paymentId) {
        await prisma.membershipPayment
          .update({
            where: { id: paymentId },
            data: { status: PaymentStatus.UNPAID },
          })
          .catch((e) => console.error("Failed to update expired payment:", e));
      }

      console.log(`Checkout session expired: ${session.id}`);
      return { success: true, message: "Session expired handled." };
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      console.log(`Payment intent failed: ${paymentIntent.id}`);
      return { success: true, message: "Payment failed handled." };
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
      return { success: true, message: `Unhandled event: ${event.type}` };
  }
};

const handleStripeWebhookForIdeaPurchase = async (event: Stripe.Event) => {
  const alreadyProcessed = await prisma.ideaPayment.findFirst({
    where: { stripeEventId: event.id },
  });

  if (alreadyProcessed) {
    console.log(
      `[IdeaPurchase] Event ${event.id} already processed. Skipping.`,
    );
    return { success: true, message: "Event already processed." };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session?.metadata?.userId;
      const ideaId = session?.metadata?.ideaId;
      const paymentId = session?.metadata?.paymentId;

      if (!userId || !ideaId || !paymentId) {
        console.error("[IdeaPurchase] Missing metadata:", {
          userId,
          ideaId,
          paymentId,
        });
        return { success: false, message: "Missing metadata." };
      }

      if (session.payment_status !== "paid") {
        console.log(
          "[IdeaPurchase] Payment not completed:",
          session.payment_status,
        );
        return { success: false, message: "Payment not completed." };
      }

      const payment = await prisma.ideaPayment.findFirst({
        where: { id: paymentId, userId, ideaId },
      });

      if (!payment) {
        console.error("[IdeaPurchase] Payment not found:", {
          paymentId,
          userId,
          ideaId,
        });
        return { success: false, message: "Payment not found." };
      }

      if (payment.status === PaymentStatus.PAID) {
        console.log("[IdeaPurchase] Already PAID. Skipping.");
        return { success: true, message: "Already processed." };
      }

      try {
        await prisma.$transaction(async (tx) => {
          // Update idea payment record
          await tx.ideaPayment.update({
            where: { id: paymentId },
            data: {
              status: PaymentStatus.PAID,
              stripePaymentIntentId: session.payment_intent as string,
              stripeSessionId: session.id,
              stripeEventId: event.id,
              stripePaymentData: JSON.parse(JSON.stringify(session)),
            },
          });

          await tx.ideaPurchase.create({
            data: {
              userId,
              ideaId,
              ideaPaymentId: paymentId,
              price: payment.amount,
            },
          });
        });

        console.log(
          `[IdeaPurchase] Purchased ideaId: ${ideaId} by userId: ${userId}`,
        );
        return { success: true, message: "Idea purchased successfully." };
      } catch (txError) {
        console.error("[IdeaPurchase] Transaction failed:", txError);
        return { success: false, message: "Transaction failed." };
      }
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      const paymentId = session?.metadata?.paymentId;

      if (paymentId) {
        await prisma.ideaPayment
          .update({
            where: { id: paymentId },
            data: { status: PaymentStatus.UNPAID },
          })
          .catch((e) =>
            console.error(
              "[IdeaPurchase] Failed to update expired payment:",
              e,
            ),
          );
      }

      console.log(`[IdeaPurchase] Session expired: ${session.id}`);
      return { success: true, message: "Session expired handled." };
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      console.log(`[IdeaPurchase] Payment intent failed: ${paymentIntent.id}`);
      return { success: true, message: "Payment failed handled." };
    }

    default:
      console.log(`[IdeaPurchase] Unhandled event type: ${event.type}`);
      return { success: true, message: `Unhandled event: ${event.type}` };
  }
};

const handleStripeWebhook = async (event: Stripe.Event) => {
  const session = event.data.object as { metadata?: { type?: string } };
  const type = session?.metadata?.type;

  console.log(`[Webhook] Event: ${event.type} | Type: ${type ?? "unknown"}`);

  if (type === "membership") {
    return await handleStripeWebhokEventForMembership(event);
  }

  if (type === "idea_purchase") {
    return await handleStripeWebhookForIdeaPurchase(event);
  }

  console.log(
    `[Webhook] No handler for type: ${type ?? "none"} | event: ${event.type}`,
  );
  return { success: true, message: `No handler for type: ${type ?? "none"}` };
};

export const paymentService = {
  handleStripeWebhook,
};
