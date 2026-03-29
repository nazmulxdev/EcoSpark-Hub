import { Router } from "express";
import { blogRoutes } from "../modules/blog/blog.route";
import { categoryRoutes } from "../modules/category/category.route";
import { memberRoute } from "../modules/member/member.route";
import { ideaRoutes } from "../modules/idea/idea.route";
import { watchlistRoute } from "../modules/watchlist/watchlist.route";
import { voteRoutes } from "../modules/vote/vote.route";

const router = Router();

router.use("/blog", blogRoutes);
router.use("/category", categoryRoutes);
router.use("/member", memberRoute);
router.use("/ideas", ideaRoutes);
router.use("/watchlist", watchlistRoute);
router.use("/votes", voteRoutes);

export const indexRoutes = router;
