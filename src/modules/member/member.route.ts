import { Router } from "express";
import { memberController } from "./member.controller";
import { Role } from "../../generated/prisma/enums";
import authMiddleware from "../../middlewares/AuthMiddelware";

const router = Router();

router.post(
  "/become-member",
  authMiddleware(Role.USER),
  memberController.becomeMember,
);
router.post(
  "/become-member-with-pay-later",
  authMiddleware(Role.USER),
  memberController.becomeMemberWithPayLater,
);
router.post(
  "/initiate-payment",
  authMiddleware(Role.USER),
  memberController.initiatePayment,
);

export const memberRoute = router;
