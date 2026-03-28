import { Router } from "express";
import { blogController } from "./blog.controller";
import authMiddleware from "../../middlewares/AuthMiddelware";
import { Role } from "../../generated/prisma/enums";
import { multerUploader } from "../../config/multer.config";
import validateRequest from "../../middlewares/ValidateRequest";
import { createBlogZodSchema, updateBlogZodSchema } from "./blog.validation";

const router = Router();

router.post(
  "/create",
  authMiddleware(Role.ADMIN),
  multerUploader.single("coverImage"),
  validateRequest({ body: createBlogZodSchema }),
  blogController.createBlog,
);

router.get("/", blogController.getAllBlogs);

router.get("/:slug", blogController.getSingleBlog);

router.patch(
  "/:slug",
  authMiddleware(Role.ADMIN),
  multerUploader.single("coverImage"),
  validateRequest({ body: updateBlogZodSchema }),
  blogController.updateBlog,
);

router.delete("/:slug", authMiddleware(Role.ADMIN), blogController.deleteBlog);

export const blogRoutes = router;
