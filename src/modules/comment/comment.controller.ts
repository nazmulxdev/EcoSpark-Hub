import { Request, Response } from "express";
import catchAsync from "../../shared/CatchAsync";
import AppResponse from "../../shared/AppResponse";
import status from "http-status";
import { commentService } from "./comment.service";

const createComment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await commentService.createComment(userId, req.body);

  AppResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Comment added successfully",
    data: result,
  });
});

const getCommentsByIdeaId = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params.ideaId as string;
  const result = await commentService.getCommentsByIdeaId(ideaId);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Comments retrieved successfully",
    data: result,
  });
});

const updateComment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const commentId = req.params.commentId as string;
  const result = await commentService.updateComment(userId, commentId, req.body);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Comment updated successfully",
    data: result,
  });
});

const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const commentId = req.params.commentId as string;
  const result = await commentService.deleteComment(userId, commentId);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Comment deleted successfully",
    data: result,
  });
});

export const commentController = {
  createComment,
  getCommentsByIdeaId,
  updateComment,
  deleteComment,
};
