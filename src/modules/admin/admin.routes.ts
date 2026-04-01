import { Router } from "express";
import { Role } from "../../generated/prisma/enums";
import authMiddleware from "../../middlewares/AuthMiddelware";
import validateRequest from "../../middlewares/ValidateRequest";
import { adminController } from "./admin.controller";
import { adminValidation } from "./admin.validation";

const router = Router();

// All admin routes require ADMIN role authentication
router.use(authMiddleware(Role.ADMIN));

router.get(
  "/dashboard",
  authMiddleware(Role.ADMIN),
  adminController.getDashboardStats,
);
router.get(
  "/payments/analysis",
  authMiddleware(Role.ADMIN),
  adminController.getPaymentAnalysis,
);

router.get("/users", authMiddleware(Role.ADMIN), adminController.getAllUsers);

router.patch(
  "/users/:userId/status",
  authMiddleware(Role.ADMIN),
  validateRequest({ body: adminValidation.changeUserStatusSchema }),
  adminController.changeUserStatus,
);

router.get(
  "/members",
  authMiddleware(Role.ADMIN),
  adminController.getAllMembers,
);

router.patch(
  "/members/:memberId/status",
  authMiddleware(Role.ADMIN),
  validateRequest({ body: adminValidation.changeMemberStatusSchema }),
  adminController.changeMemberStatus,
);

router.patch(
  "/ideas/:slug/status",
  authMiddleware(Role.ADMIN),
  validateRequest({ body: adminValidation.changeIdeaStatusSchema }),
  adminController.changeIdeaStatus,
);

export const adminRoutes = router;
