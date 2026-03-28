import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import {
  MemberStatus,
  PaymentStatus,
  Role,
} from "../../generated/prisma/enums";

// model Member {
//     id        String       @id @default(uuid())
//     userId    String       @unique
//     status    MemberStatus @default(PENDING)
//     paymentId String       @unique

//     user User @relation(fields: [userId], references: [id], onDelete: Cascade)

//     membershipPayment MembershipPayment @relation(fields: [paymentId], references: [id], onDelete: Cascade)
//     joinedAt          DateTime?
//     isActive          Boolean           @default(true)

//     createdAt DateTime @default(now())
//     updatedAt DateTime @updatedAt

//     @@map("members")
// }

// model MembershipPayment {
//     id     String @id @default(uuid())
//     userId String @unique // one membership payment per user ever

//     amount   Decimal       @db.Decimal(10, 2)
//     currency String        @default("USD")
//     status   PaymentStatus @default(UNPAID)

//     member Member? // created only when status becomes PAID

//     // Stripe
//     stripePaymentIntentId String? @unique
//     stripeSessionId       String? @unique
//     stripeEventId         String? @unique
//     stripePaymentData     Json? // raw Stripe webhook response stored here

//     createdAt DateTime @default(now())
//     updatedAt DateTime @updatedAt

//     user User @relation(fields: [userId], references: [id], onDelete: Cascade)

//     @@map("membership_payments")
// }

// model IdeaPayment {
//     id     String @id @default(uuid())
//     userId String
//     ideaId String

//     amount   Decimal       @db.Decimal(10, 2)
//     currency String        @default("USD")
//     status   PaymentStatus @default(UNPAID)

//     // Stripe
//     stripePaymentIntentId String? @unique
//     stripeSessionId       String? @unique
//     stripeEventId         String? @unique
//     stripePaymentData     Json? // raw Stripe webhook response

//     createdAt DateTime @default(now())
//     updatedAt DateTime @updatedAt

//     user     User          @relation(fields: [userId], references: [id], onDelete: Cascade)
//     idea     Idea          @relation(fields: [ideaId], references: [id], onDelete: Cascade)
//     purchase IdeaPurchase? // created only when status becomes PAID

//     @@index([userId])
//     @@index([ideaId])
//     @@index([status])
//     @@map("idea_payments")
// }

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

          // Promote user role to MEMBER
          await tx.user.update({
            where: { id: userId },
            data: { role: Role.MEMBER },
          });

          // Create or update member record
          await tx.member.upsert({
            where: { userId },
            update: {
              status: MemberStatus.APPROVED,
              joinedAt: new Date(),
              isActive: true,
            },
            create: {
              status: MemberStatus.APPROVED,
              joinedAt: new Date(),
              isActive: true,
              userId,
              paymentId
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

export const paymentService = {
  handleStripeWebhokEventForMembership,
};
