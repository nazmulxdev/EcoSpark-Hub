import { Router } from "express";
import authMiddleware from "../../middlewares/AuthMiddelware";
import { Role } from "../../generated/prisma/enums";
import { ideaController } from "./idea.controller";

const router = Router();

router.post(
  "/purchase/:ideaId",
  authMiddleware(Role.USER, Role.MEMBER),
  ideaController.purchaseIdea,
);

router.post(
  "/purchase-with-pay-later/:ideaId",
  authMiddleware(Role.USER, Role.MEMBER),
  ideaController.purchaseIdeaWithPayLater,
);

router.post(
  "/initiate-payment/:ideaId",
  authMiddleware(Role.USER, Role.MEMBER),
  ideaController.initiateIdeaPayment,
);

export const ideaPaymentRoute = router;
