import * as z from "zod";

export const createCategoryZodSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateCategoryZodSchema = createCategoryZodSchema.partial();
