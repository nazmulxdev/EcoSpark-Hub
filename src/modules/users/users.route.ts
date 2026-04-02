import { Router } from "express";
import authMiddleware from "../../middlewares/AuthMiddelware";
import { usersController } from "./users.controller";
import { Role } from "../../generated/prisma/enums";

const router = Router();

router.get(
  "/dashboard",
  authMiddleware(Role.USER),
  usersController.getUserDashboard,
);

export const usersRoute = router;
