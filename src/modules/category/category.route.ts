import { Router } from "express";
import { categoryController } from "./category.controller";
import authMiddleware from "../../middlewares/AuthMiddelware";
import { Role } from "../../generated/prisma/enums";
import validateRequest from "../../middlewares/ValidateRequest";
import { createCategoryZodSchema, updateCategoryZodSchema } from "./category.validation";

const router = Router();

router.post(
  "/create",
  authMiddleware(Role.ADMIN),
  validateRequest({ body: createCategoryZodSchema }),
  categoryController.createCategory
);

router.get("/", categoryController.getAllCategories);

router.get("/:slug", categoryController.getSingleCategory);

router.patch(
  "/:slug",
  authMiddleware(Role.ADMIN),
  validateRequest({ body: updateCategoryZodSchema }),
  categoryController.updateCategory
);

router.delete(
  "/:slug",
  authMiddleware(Role.ADMIN),
  categoryController.deleteCategory
);

export const categoryRoutes = router;
