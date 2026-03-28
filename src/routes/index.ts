import { Router } from "express";
import { blogRoutes } from "../modules/blog/blog.route";
import { categoryRoutes } from "../modules/category/category.route";

const router = Router();

router.use("/blog", blogRoutes);
router.use("/category", categoryRoutes);

export const indexRoutes = router;
