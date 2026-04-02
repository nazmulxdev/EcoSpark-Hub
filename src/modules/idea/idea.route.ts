import { Router } from "express";
import authMiddleware from "../../middlewares/AuthMiddelware";
import { Role } from "../../generated/prisma/enums";
import { ideaController } from "./idea.controller";
import validateRequest from "../../middlewares/ValidateRequest";
import { createIdeaZodSchema, updateIdeaZodSchema } from "./idea.validation";
import { multerUploader } from "../../config/multer.config";
import { ideaUtils } from "./idea.utils";

const router = Router();
router.get("/my-ideas", authMiddleware(Role.MEMBER), ideaController.getMyIdeas);
router.get(
  "/my-purchased-ideas",
  authMiddleware(Role.MEMBER, Role.USER),
  ideaController.getMyPurchasedIdeas,
);

router.get(
  "/my-ideas/:slug",
  authMiddleware(Role.MEMBER),
  ideaController.getMyIdeaById,
);
router.get(
  "/:ideaId/purchase-status",
  authMiddleware(Role.MEMBER, Role.USER, Role.ADMIN),
  ideaController.checkPurchaseStatus,
);

router.get(
  "/my-draft-ideas",
  authMiddleware(Role.MEMBER),
  ideaController.getMyDraftIdeas,
);

router.get("/", authMiddleware(Role.ADMIN), ideaController.getAllIdeasForAdmin);

router.get("/public", ideaController.getAllIdeasPublic);

router.get(
  "/:slug",
  authMiddleware(Role.MEMBER, Role.ADMIN, Role.USER),
  ideaController.getIdeaById,
);

router.patch(
  "/:slug",
  authMiddleware(Role.MEMBER),
  multerUploader.fields([
    {
      name: "images",
      maxCount: 5,
    },
  ]),
  ideaUtils.fileuploaderMiddlewareForUpdate,
  validateRequest({ body: updateIdeaZodSchema }),
  ideaController.updateMyIdea,
);

router.patch(
  "/:slug/submit",
  authMiddleware(Role.MEMBER),
  ideaController.submitIdeaForAdminApproval,
);

router.post(
  "/",
  authMiddleware(Role.MEMBER),
  multerUploader.fields([
    {
      name: "images",
      maxCount: 5,
    },
  ]),
  ideaUtils.fileuploaderMiddlewareForCreate,
  validateRequest({ body: createIdeaZodSchema }),
  ideaController.createIdea,
);

router.delete(
  "/:slug",
  authMiddleware(Role.MEMBER),
  ideaController.deleteMyIdea,
);

export const ideaRoutes = router;
