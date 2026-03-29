import { Router } from "express";
import { Role } from "../../generated/prisma/enums";
import authMiddleware from "../../middlewares/AuthMiddelware";
import validateRequest from "../../middlewares/ValidateRequest";
import { adminController } from "./admin.controller";
import { adminValidation } from "./admin.validation";

const router = Router();

// All admin routes require ADMIN role authentication
router.use(authMiddleware(Role.ADMIN));

router.get("/dashboard", adminController.getDashboardStats);

router.get("/users", adminController.getAllUsers);

router.patch(
  "/users/:userId/status",
  validateRequest({ body: adminValidation.changeUserStatusSchema }),
  adminController.changeUserStatus,
);

router.get("/members", adminController.getAllMembers);

router.patch(
  "/members/:memberId/status",
  validateRequest({ body: adminValidation.changeMemberStatusSchema }),
  adminController.changeMemberStatus,
);

router.get("/ideas", adminController.getAllIdeasForAdmin);

router.patch(
  "/ideas/:slug/status",
  validateRequest({ body: adminValidation.changeIdeaStatusSchema }),
  adminController.changeIdeaStatus,
);

export const adminRoutes = router;
