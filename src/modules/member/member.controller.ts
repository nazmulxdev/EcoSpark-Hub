import { Request, Response } from "express";
import AppResponse from "../../shared/AppResponse";
import { memberService } from "./member.service";
import status from "http-status";
import catchAsync from "../../shared/CatchAsync";

const becomeMember = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await memberService.becomeMember(userId);
  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Member created successfully.",
    data: result,
  });
});

const becomeMemberWithPayLater = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const result = await memberService.becomeMemberWithPayLater(userId);
    AppResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Member created successfully.",
      data: result,
    });
  },
);

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await memberService.initiatePayment(userId);
  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payment initiated successfully.",
    data: result,
  });
});

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
  becomeMember,
  becomeMemberWithPayLater,
  initiatePayment,
  getMemberDashboard,
};
