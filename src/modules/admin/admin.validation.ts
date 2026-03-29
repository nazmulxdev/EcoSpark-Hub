import { z } from "zod";
import {
  IdeaStatus,
  MemberStatus,
  UserStatus,
} from "../../generated/prisma/enums";

export const changeUserStatusSchema = z.object({
  userStatus: z.nativeEnum(UserStatus, {
    error: `userStatus must be one of: ${Object.values(UserStatus).join(", ")}`,
  }),
});

export const changeMemberStatusSchema = z.object({
  status: z.nativeEnum(MemberStatus, {
    error: `status must be one of: ${Object.values(MemberStatus).join(", ")}`,
  }),
});

export const changeIdeaStatusSchema = z
  .object({
    status: z.nativeEnum(IdeaStatus, {
      error: `status must be one of: ${Object.values(IdeaStatus).join(", ")}`,
    }),
    rejectionFeedback: z.string().min(10).max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === IdeaStatus.REJECTED && !data.rejectionFeedback) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectionFeedback"],
        message:
          "rejectionFeedback is required when rejecting an idea (min 10 chars).",
      });
    }
  });

export const adminValidation = {
  changeUserStatusSchema,
  changeMemberStatusSchema,
  changeIdeaStatusSchema,
};
