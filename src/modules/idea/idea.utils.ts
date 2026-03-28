import { NextFunction, Request, Response } from "express";
import {
  IdeaAccessType,
  IdeaStatus,
  PaymentStatus,
  Role,
  UserStatus,
} from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { ICreateIdea, IUpdateIdea } from "./idea.interface";

const validateUserAndIdea = async (userId: string, ideaId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, "User not found.", "NOT_FOUND", [
      { field: "userId", message: "User not found." },
    ]);
  }

  if (user.userStatus !== UserStatus.ACTIVE) {
    throw new AppError(400, "User account is not active.", "USER_INACTIVE", [
      { field: "userId", message: "User account is not active." },
    ]);
  }

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });

  if (!idea) {
    throw new AppError(404, "Idea not found.", "NOT_FOUND", [
      { field: "ideaId", message: "Idea not found." },
    ]);
  }

  if (idea.status !== IdeaStatus.APPROVED) {
    throw new AppError(400, "Idea is not available.", "IDEA_NOT_AVAILABLE", [
      { field: "ideaId", message: "This idea is not publicly available." },
    ]);
  }

  // FREE ideas don't need payment
  if (idea.accessType === IdeaAccessType.FREE) {
    throw new AppError(
      400,
      "This idea is free. No payment needed.",
      "IDEA_IS_FREE",
    );
  }

  // MEMBER_ONLY — members get free access
  if (
    idea.accessType === IdeaAccessType.MEMBER_ONLY &&
    user.role === Role.MEMBER
  ) {
    throw new AppError(
      400,
      "This idea is free for members.",
      "IDEA_FREE_FOR_MEMBER",
    );
  }

  // Already purchased
  const alreadyPurchased = await prisma.ideaPurchase.findUnique({
    where: { userId_ideaId: { userId, ideaId } },
  });

  if (alreadyPurchased) {
    throw new AppError(
      400,
      "You have already purchased this idea.",
      "ALREADY_PURCHASED",
    );
  }

  if (!idea.price) {
    throw new AppError(400, "Idea price is not set.", "PRICE_NOT_SET", [
      { field: "ideaId", message: "This idea has no price set." },
    ]);
  }

  return { user, idea };
};

const checkExistingPayment = async (userId: string, ideaId: string) => {
  const existingPayment = await prisma.ideaPayment.findFirst({
    where: {
      userId,
      ideaId,
      status: { in: [PaymentStatus.PENDING, PaymentStatus.UNPAID] },
    },
  });

  return existingPayment;
};

const fileuploaderMiddlewareForCreate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.body.data) {
    req.body = JSON.parse(req.body.data);
  }

  const payload: ICreateIdea = req.body;

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[] | undefined;
  };

  console.log(files);

  if (files.images && files.images.length > 0) {
    payload.images = files.images.map((file) => file.path);
  }

  next();
};

const fileuploaderMiddlewareForUpdate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.body.data) {
    req.body = JSON.parse(req.body.data);
  }

  const payload: IUpdateIdea = req.body;

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[] | undefined;
  };

  console.log(files);

  if (files.images && files.images.length > 0) {
    payload.images = files.images.map((file) => file.path);
  }

  next();
};

export const ideaUtils = {
  validateUserAndIdea,
  checkExistingPayment,
  fileuploaderMiddlewareForCreate,
  fileuploaderMiddlewareForUpdate,
};
