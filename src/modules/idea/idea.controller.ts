import { Request, Response } from "express";
import catchAsync from "../../shared/CatchAsync";
import AppResponse from "../../shared/AppResponse";

import status from "http-status";
import { ideaService } from "./idea.service";

const purchaseIdea = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const ideaId = req.params.ideaId as string;

  const result = await ideaService.purchaseIdea(userId, ideaId);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payment session created. Redirect user to paymentUrl.",
    data: result,
  });
});

const purchaseIdeaWithPayLater = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const ideaId = req.params.ideaId as string;

    const result = await ideaService.purchaseIdeaWithPayLater(userId, ideaId);

    AppResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Payment record created. Use initiate-payment to pay later.",
      data: result,
    });
  },
);

const initiateIdeaPayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const ideaId = req.params.ideaId as string;

  const result = await ideaService.initiateIdeaPayment(userId, ideaId);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payment session created. Redirect user to paymentUrl.",
    data: result,
  });
});

export const ideaController = {
  purchaseIdea,
  purchaseIdeaWithPayLater,
  initiateIdeaPayment,
};
