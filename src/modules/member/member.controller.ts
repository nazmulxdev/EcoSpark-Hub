import { Request, Response } from "express";
import AppResponse from "../../shared/AppResponse";
import { memberService } from "./member.service";
import status from "http-status";
import catchAsync from "../../shared/CatchAsync";

const getMemberDashboard = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await memberService.getMemberDashboard(userId);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Member dashboard retrieved successfully.",
    data: result,
  });
});

export const memberController = {
  getMemberDashboard,
};
