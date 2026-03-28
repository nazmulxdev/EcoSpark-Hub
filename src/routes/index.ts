import { Router } from "express";
import { blogRoutes } from "../modules/blog/blog.route";
import { categoryRoutes } from "../modules/category/category.route";
import { memberRoute } from "../modules/member/member.route";

const router = Router();

router.use("/blog", blogRoutes);
router.use("/category", categoryRoutes);
router.use("/member", memberRoute);

export const indexRoutes = router;
