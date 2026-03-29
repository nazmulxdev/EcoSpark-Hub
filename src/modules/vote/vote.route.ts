import { Router } from "express";
import authMiddleware from "../../middlewares/AuthMiddelware";
import { Role } from "../../generated/prisma/enums";
import validateRequest from "../../middlewares/ValidateRequest";
import { createVoteZodSchema } from "./vote.validation";
import { voteController } from "./vote.controller";

const router = Router();

router.post(
  "/",
  authMiddleware(Role.USER, Role.MEMBER),
  validateRequest({ body: createVoteZodSchema }),
  voteController.castVote,
);

export const voteRoutes = router;
