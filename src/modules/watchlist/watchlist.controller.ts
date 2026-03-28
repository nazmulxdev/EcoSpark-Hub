import { Request, Response } from "express";
import catchAsync from "../../shared/CatchAsync";
import AppResponse from "../../shared/AppResponse";
import status from "http-status";
import { watchlistService } from "./watchlist.service";
import { IQueryParams } from "../../interfaces/query.interface";

const addToWatchlist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await watchlistService.addToWatchlist(userId, req.body);

  AppResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Idea added to watchlist successfully.",
    data: result,
  });
});

const removeFromWatchlist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const ideaId = req.params.ideaId as string;
  const result = await watchlistService.removeFromWatchlist(userId, ideaId);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Idea removed from watchlist successfully.",
    data: result,
  });
});

const getMyWatchlist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await watchlistService.getMyWatchlist(
    userId,
    req.query as IQueryParams,
  );

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Watchlist retrieved successfully.",
    data: result,
  });
});

export const watchlistController = {
  addToWatchlist,
  removeFromWatchlist,
  getMyWatchlist,
};
