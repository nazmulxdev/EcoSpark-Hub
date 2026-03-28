import * as z from "zod";

export const createCategoryZodSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  isActive: z.boolean().optional().default(true),
});

export const updateCategoryZodSchema = createCategoryZodSchema.partial();
