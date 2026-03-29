import { Request, Response } from "express";
import catchAsync from "../../shared/CatchAsync";
import AppResponse from "../../shared/AppResponse";
import status from "http-status";
import { voteService } from "./vote.service";

const castVote = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { ideaId, type } = req.body;

  console.log(req.body);

  const result = await voteService.castVote(userId, ideaId, type);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: result.message,
    data: result.vote,
  });
});

export const voteController = {
  castVote,
};
