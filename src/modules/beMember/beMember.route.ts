import { Router } from "express";
import authMiddleware from "../../middlewares/AuthMiddelware";
import { Role } from "../../generated/prisma/enums";
import { beMemberController } from "./beMember.controller";

const router = Router();

router.post(
  "/become-member",
  authMiddleware(Role.USER),
  beMemberController.becomeMember,
);
router.post(
  "/become-member-with-pay-later",
  authMiddleware(Role.USER),
  beMemberController.becomeMemberWithPayLater,
);
router.post(
  "/initiate-payment",
  authMiddleware(Role.USER),
  beMemberController.initiatePayment,
);
