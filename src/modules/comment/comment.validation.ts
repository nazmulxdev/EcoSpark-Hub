import * as z from "zod";

export const createCommentZodSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  ideaId: z.string().uuid("Invalid idea ID"),
  parentId: z.string().uuid("Invalid parent comment ID").optional(),
});

export const updateCommentZodSchema = z.object({
  content: z.string().min(1, "Comment content is required").optional(),
  isDeleted: z.boolean().optional(),
});
