import { Router } from "express";
import authMiddleware from "../../middlewares/AuthMiddelware";
import { Role } from "../../generated/prisma/enums";
import validateRequest from "../../middlewares/ValidateRequest";
import { createWatchlistZodSchema } from "./watchlist.validation";
import { watchlistController } from "./watchlist.controller";

const router = Router();

router.post(
  "/add",
  authMiddleware(Role.USER, Role.MEMBER),
  validateRequest({ body: createWatchlistZodSchema }),
  watchlistController.addToWatchlist,
);

router.delete(
  "/remove/:ideaId",
  authMiddleware(Role.USER, Role.MEMBER),
  watchlistController.removeFromWatchlist,
);

router.get(
  "/",
  authMiddleware(Role.USER, Role.MEMBER),
  watchlistController.getMyWatchlist,
);

export const watchlistRoute = router;
