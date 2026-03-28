import { Router } from "express";
import authMiddleware from "../../middlewares/AuthMiddelware";
import { Role } from "../../generated/prisma/enums";
import { ideaController } from "./idea.controller";
import validateRequest from "../../middlewares/ValidateRequest";
import { createIdeaZodSchema, updateIdeaZodSchema } from "./idea.validation";
import { multerUploader } from "../../config/multer.config";
import { ideaUtils } from "./idea.utils";

const router = Router();

// Member CRUD routes for Ideas
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

router.get("/my-ideas", authMiddleware(Role.MEMBER), ideaController.getMyIdeas);

router.get(
  "/my-ideas/:slug",
  authMiddleware(Role.MEMBER),
  ideaController.getMyIdeaById,
);

router.get("/", authMiddleware(Role.MEMBER), ideaController.getAllIdeas);

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

router.delete(
  "/:slug",
  authMiddleware(Role.MEMBER),
  ideaController.deleteMyIdea,
);

// Payment routes (currently mixed in the same router for simplicity, but can be prefixed)  payment have created by id not used slug
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

export const ideaRoutes = router;
