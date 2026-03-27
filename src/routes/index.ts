import { Router } from "express";
import { blogRoutes } from "../modules/blog/blog.route";

const router = Router();

router.use("/blog", blogRoutes);

export const indexRoutes = router;
