import { Router } from "express";
import { blogController } from "./blog.controller";
import authMiddleware from "../../middlewares/AuthMiddelware";
import { Role } from "../../generated/prisma/enums";
import { multerUploader } from "../../config/multer.config";
import validateRequest from "../../middlewares/ValidateRequest";
import { createBlogZodSchema } from "./blog.validation";

const router = Router();

router.post(
  "/create",
  authMiddleware(Role.ADMIN),
  multerUploader.single("coverImage"),
  validateRequest({ body: createBlogZodSchema }),
  blogController.createBlog,
);

router.get("/", blogController.getAllBlogs);

export const blogRoutes = router;
