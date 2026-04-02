import { Router } from "express";
import authMiddleware from "../../middlewares/AuthMiddelware";
import { Role } from "../../generated/prisma/enums";
import { ideaPurchaseController } from "./ideaPurchase.controller";

const router = Router();

router.post(
  "/purchase/:ideaId",
  authMiddleware(Role.USER, Role.MEMBER),
  ideaPurchaseController.purchaseIdea,
);

router.post(
  "/purchase-with-pay-later/:ideaId",
  authMiddleware(Role.USER, Role.MEMBER),
  ideaPurchaseController.purchaseIdeaWithPayLater,
);

router.post(
  "/initiate-payment/:ideaId",
  authMiddleware(Role.USER, Role.MEMBER),
  ideaPurchaseController.initiateIdeaPayment,
);

export const ideaPurchaseRoute = router;
