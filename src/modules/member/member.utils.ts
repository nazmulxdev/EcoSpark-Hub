import { UserStatus } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";

const validateUserForMembership = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, "User not found.", "NOT_FOUND", [
      { field: "userId", message: "User not found." },
    ]);
  }

  if (user.userStatus !== UserStatus.ACTIVE) {
    throw new AppError(400, "User is not active.", "USER_INACTIVE", [
      { field: "userId", message: "User account is not active." },
    ]);
  }

  const existingMember = await prisma.member.findUnique({ where: { userId } });
  if (existingMember) {
    throw new AppError(400, "User is already a member.", "ALREADY_MEMBER", [
      { field: "userId", message: "User is already a member." },
    ]);
  }

  return user;
};

export const memberUtils = {
  validateUserForMembership,
};
