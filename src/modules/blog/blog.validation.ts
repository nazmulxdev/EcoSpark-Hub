import * as z from "zod";

export const createBlogZodSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().url("Invalid cover image URL").optional(),
  isPublished: z.boolean().optional().default(false),
  publishedAt: z.coerce.date().optional(),
});

export const updateBlogZodSchema = createBlogZodSchema.partial();
