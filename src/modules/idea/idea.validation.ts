// validations/idea.validation.ts
import * as z from "zod";
import { IdeaStatus, IdeaAccessType } from "../../generated/prisma/enums";

export const createIdeaZodSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    problemStatement: z.string().min(1, "Problem statement is required"),
    proposedSolution: z.string().min(1, "Proposed solution is required"),
    description: z.string().min(1, "Description is required"),
    images: z.array(z.string().url("Invalid image URL")).optional().default([]),
    accessType: z
      .enum([
        IdeaAccessType.FREE,
        IdeaAccessType.MEMBER_ONLY,
        IdeaAccessType.PAID,
      ])
      .optional()
      .default(IdeaAccessType.FREE),
    price: z
      .number()
      .nonnegative("Price must be a non-negative number")
      .optional(),
    categoryId: z.string().uuid("Invalid category ID"),
  })
  .refine(
    (data) => {
      if (data.accessType === IdeaAccessType.PAID) {
        return data.price !== undefined && data.price > 0;
      }
      return true;
    },
    {
      message: "Price is required and must be greater than 0 for PAID ideas",
      path: ["price"],
    },
  );

export const updateIdeaZodSchema = z
  .object({
    title: z.string().min(1, "Title is required").optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
      .optional(),
    problemStatement: z.string().min(1).optional(),
    proposedSolution: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    images: z.array(z.string().url("Invalid image URL")).optional(),
    status: z
      .enum([
        IdeaStatus.DRAFT,
        IdeaStatus.UNDER_REVIEW,
        IdeaStatus.APPROVED,
        IdeaStatus.REJECTED,
      ])
      .optional(),
    accessType: z
      .enum([
        IdeaAccessType.FREE,
        IdeaAccessType.MEMBER_ONLY,
        IdeaAccessType.PAID,
      ])
      .optional(),
    rejectionFeedback: z.string().optional(),
    price: z.number().nonnegative("Price must be non-negative").optional(),
    publishedAt: z.coerce.date().optional(),
    categoryId: z.string().uuid("Invalid category ID").optional(),
  })
  .refine(
    (data) => {
      if (data.accessType === IdeaAccessType.PAID) {
        return data.price !== undefined && data.price > 0;
      }
      return true;
    },
    {
      message: "Price is required and must be greater than 0 for PAID ideas",
      path: ["price"],
    },
  );

export const ideaStatusUpdateZodSchema = z
  .object({
    status: z.enum([IdeaStatus.APPROVED, IdeaStatus.REJECTED]),
    rejectionFeedback: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === IdeaStatus.REJECTED) {
        return !!data.rejectionFeedback;
      }
      return true;
    },
    {
      message: "Rejection feedback is required when rejecting an idea",
      path: ["rejectionFeedback"],
    },
  );
