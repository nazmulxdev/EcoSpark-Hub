import { Router } from "express";
import { memberController } from "./member.controller";
import { Role } from "../../generated/prisma/enums";
import authMiddleware from "../../middlewares/AuthMiddelware";

const router = Router();

router.get(
  "/dashboard",
  authMiddleware(Role.MEMBER),
  memberController.getMemberDashboard,
);

export const memberRoute = router;
