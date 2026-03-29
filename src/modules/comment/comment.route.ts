import { Router } from "express";
import authMiddleware from "../../middlewares/AuthMiddelware";
import { Role } from "../../generated/prisma/enums";
import validateRequest from "../../middlewares/ValidateRequest";
import { createCommentZodSchema, updateCommentZodSchema } from "./comment.validation";
import { commentController } from "./comment.controller";

const router = Router();

// Create a comment (or reply)
router.post(
  "/",
  authMiddleware(Role.USER, Role.MEMBER),
  validateRequest({ body: createCommentZodSchema }),
  commentController.createComment,
);

// Get all comments for an idea
// No auth middleware so that public visitors can also see comments
router.get(
  "/:ideaId",
  commentController.getCommentsByIdeaId,
);

// Update a comment
router.patch(
  "/:commentId",
  authMiddleware(Role.USER, Role.MEMBER),
  validateRequest({ body: updateCommentZodSchema }),
  commentController.updateComment,
);

// Soft delete a comment
router.delete(
  "/:commentId",
  authMiddleware(Role.USER, Role.MEMBER),
  commentController.deleteComment,
);

export const commentRoutes = router;
