import { deleteFileFromCloudinary } from "../../config/cloudinary.config";
import { config } from "../../config/env";
import { stripe } from "../../config/stripe.config";
import { Idea, Prisma } from "../../generated/prisma/client";
import {
  IdeaAccessType,
  IdeaStatus,
  PaymentStatus,
} from "../../generated/prisma/enums";
import { IdeaInclude } from "../../generated/prisma/models";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { generateUniqueSlug } from "../../utils/generateSlug";
import { ideaFilterableFields, ideaSearchableFields } from "./idea.constant";
import { ICreateIdea } from "./idea.interface";
import { ideaUtils } from "./idea.utils";

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

// ── 4. Member CRUD operations ────────────────────────────────────────────────

const createIdea = async (userId: string, payload: ICreateIdea) => {
  if (payload.accessType && payload.accessType !== IdeaAccessType.FREE) {
    if (!payload.price || Number(payload.price) <= 0) {
      throw new AppError(
        400,
        "Price must be strictly positive for non-free ideas",
        "INVALID_PRICE",
      );
    }
  } else {
    payload.price = null;
  }

  const slug = await generateUniqueSlug(payload.title, "idea");

  const idea = await prisma.idea.create({
    data: {
      ...payload,
      title: payload.title as string,
      slug: slug,
      problemStatement: payload.problemStatement as string,
      proposedSolution: payload.proposedSolution as string,
      description: payload.description as string,
      categoryId: payload.categoryId as string,
      authorId: userId,
      status: IdeaStatus.DRAFT,
      images: payload.images as string[],
      accessType: payload.accessType as IdeaAccessType,
      price: payload.price as number | null,
    },
  });

  return idea;
};

const getAllIdeas = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Idea,
    Prisma.IdeaWhereInput,
    IdeaInclude
  >(prisma.idea, query, {
    searchableFields: ideaSearchableFields,
    filterableFields: ideaFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .paginate()
    .sort()
    .fields()
    .execute();

  return result;
};

const getIdeasForMember = async (userId: string, query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Idea,
    Prisma.IdeaWhereInput,
    IdeaInclude
  >(prisma.idea, query, {
    searchableFields: ideaSearchableFields,
    filterableFields: ideaFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .paginate()
    .sort()
    .fields()
    .where({ authorId: userId })
    .execute();

  return result;
};

const getIdeaByIdForMember = async (userId: string, slug: string) => {
  const idea = await prisma.idea.findUnique({
    where: { slug: slug, authorId: userId },
    include: {
      category: true,
      _count: {
        select: {
          votes: true,
          comments: true,
          purchases: true,
        },
      },
    },
  });

  if (!idea) {
    throw new AppError(
      404,
      "Idea not found or you don't have access",
      "NOT_FOUND",
    );
  }

  return idea;
};

const updateIdeaForMember = async (
  userId: string,
  slug: string,
  payload: Record<string, unknown>,
) => {
  const idea = await prisma.idea.findUnique({
    where: { slug: slug, authorId: userId },
  });

  if (!idea) {
    throw new AppError(
      404,
      "Idea not found or you don't have access",
      "NOT_FOUND",
    );
  }

  const newAccessType = payload.accessType ?? idea.accessType;
  const newPrice = payload.price !== undefined ? payload.price : idea.price;

  if (newAccessType !== IdeaAccessType.FREE) {
    if (newPrice === null || newPrice === undefined || Number(newPrice) <= 0) {
      throw new AppError(
        400,
        "Price must be strictly positive for non-free access types",
        "INVALID_PRICE",
      );
    }
  } else if (newAccessType === IdeaAccessType.FREE) {
    payload.price = null;
  }

  const updatedIdea = await prisma.idea.update({
    where: { id: idea.id },
    data: payload,
  });

  return updatedIdea;
};

const deleteIdeaForMember = async (userId: string, slug: string) => {
  const idea = await prisma.idea.findUnique({
    where: { slug: slug, authorId: userId },
  });

  if (!idea) {
    throw new AppError(
      404,
      "Idea not found or you don't have access",
      "NOT_FOUND",
    );
  }

  if (idea.status === IdeaStatus.APPROVED) {
    throw new AppError(
      400,
      "Idea cannot be deleted as it is in approved mode",
      "ALREADY_PURCHASED",
    );
  }

  if (idea.status === IdeaStatus.REJECTED) {
    throw new AppError(
      400,
      "Idea cannot be deleted as it is in rejected mode",
      "ALREADY_PURCHASED",
    );
  }

  if (idea.status === IdeaStatus.UNDER_REVIEW) {
    throw new AppError(
      400,
      "Idea cannot be deleted as it is in under review mode",
      "ALREADY_PURCHASED",
    );
  }

  const isIdeaPurchased = await prisma.ideaPayment.findFirst({
    where: { ideaId: idea.id, status: PaymentStatus.PAID },
  });

  if (isIdeaPurchased) {
    throw new AppError(
      400,
      "Idea cannot be deleted as it has been purchased",
      "ALREADY_PURCHASED",
    );
  }

  if (idea.images) {
    if (idea.images.length > 0) {
      await Promise.all(
        idea.images.map((image) => deleteFileFromCloudinary(image)),
      );
    }
  }

  await prisma.idea.delete({
    where: { id: idea.id },
  });

  return { message: "Idea deleted successfully" };
};

export const ideaService = {
  purchaseIdea,
  purchaseIdeaWithPayLater,
  initiateIdeaPayment,
  createIdea,
  getIdeasForMember,
  getIdeaByIdForMember,
  updateIdeaForMember,
  deleteIdeaForMember,
  getAllIdeas,
};
