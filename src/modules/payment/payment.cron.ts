import cron from "node-cron";
import { prisma } from "../../lib/prisma";
import { PaymentStatus } from "../../generated/prisma/enums";

const minutesAgo = (minutes: number): Date => {
  return new Date(Date.now() - minutes * 60 * 1000);
};

const EXPIRY_MINUTES = 30;

const expireMembershipPayments = async (): Promise<void> => {
  const cutoff = minutesAgo(EXPIRY_MINUTES);

  const result = await prisma.membershipPayment.updateMany({
    where: {
      status: { in: [PaymentStatus.UNPAID, PaymentStatus.PENDING] },
      createdAt: { lt: cutoff },
    },
    data: { status: PaymentStatus.UNPAID },
  });

  if (result.count > 0) {
    console.log(
      `[Cron] Expired ${result.count} stale membership payment(s) older than ${EXPIRY_MINUTES} min.`,
    );
  }
};

const expireIdeaPayments = async (): Promise<void> => {
  const cutoff = minutesAgo(EXPIRY_MINUTES);

  const result = await prisma.ideaPayment.updateMany({
    where: {
      status: { in: [PaymentStatus.UNPAID, PaymentStatus.PENDING] },
      createdAt: { lt: cutoff },
    },
    data: { status: PaymentStatus.UNPAID },
  });

  if (result.count > 0) {
    console.log(
      `[Cron] Expired ${result.count} stale idea payment(s) older than ${EXPIRY_MINUTES} min.`,
    );
  }
};

const runExpireStalePayments = async (): Promise<void> => {
  console.log("[Cron] Running stale payment expiry check...");
  try {
    await Promise.all([expireMembershipPayments(), expireIdeaPayments()]);
  } catch (error) {
    console.error("[Cron] Error during stale payment expiry:", error);
  }
};

export const startPaymentCronJobs = (): void => {
  cron.schedule("*/5 * * * *", runExpireStalePayments, {
    timezone: "UTC",
  });

  console.log(
    "[Cron] Payment expiry cron job registered — runs every 5 minutes.",
  );
};
