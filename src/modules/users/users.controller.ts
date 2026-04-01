import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/CatchAsync";
import AppResponse from "../../shared/AppResponse";
import { userService } from "./users.service";

const getUserDashboard = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await userService.getUserDashboard(userId as string);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User dashboard data retrieved successfully.",
    data: result,
  });
});

export const usersController = {
  getUserDashboard,
};
