import { Request, Response } from "express";
import catchAsync from "../../shared/CatchAsync";
import AppResponse from "../../shared/AppResponse";
import status from "http-status";
import { beMemberService } from "./beMember.service";

const becomeMember = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await beMemberService.becomeMember(userId);
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
    const result = await beMemberService.becomeMemberWithPayLater(userId);
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
  const result = await beMemberService.initiatePayment(userId);
  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payment initiated successfully.",
    data: result,
  });
});

export const beMemberController = {
  becomeMember,
  becomeMemberWithPayLater,
  initiatePayment,
};
