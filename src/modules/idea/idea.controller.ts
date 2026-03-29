import { Request, Response } from "express";
import catchAsync from "../../shared/CatchAsync";
import AppResponse from "../../shared/AppResponse";

import status from "http-status";
import { ideaService } from "./idea.service";
import { IQueryParams } from "../../interfaces/query.interface";

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

const createIdea = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;

  console.log(req.files);

  const result = await ideaService.createIdea(userId, req.body);

  AppResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Idea created successfully.",
    data: result,
  });
});

const getAllIdeas = catchAsync(async (req: Request, res: Response) => {
  const result = await ideaService.getAllIdeas(req.query as IQueryParams);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Ideas retrieved successfully.",
    data: result,
  });
});

const getMyIdeas = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await ideaService.getIdeasForMember(
    userId,
    req.query as IQueryParams,
  );

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Ideas retrieved successfully.",
    data: result,
  });
});

const getMyIdeaById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const slug = req.params.slug as string;
  const result = await ideaService.getIdeaByIdForMember(userId, slug);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Idea retrieved successfully.",
    data: result,
  });
});

const getIdeaById = catchAsync(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const result = await ideaService.getIdeaById(slug);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Idea retrieved successfully.",
    data: result,
  });
});

const updateMyIdea = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const slug = req.params.slug as string;
  const result = await ideaService.updateIdeaForMember(userId, slug, req.body);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Idea updated successfully.",
    data: result,
  });
});

const deleteMyIdea = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const slug = req.params.slug as string;
  const result = await ideaService.deleteIdeaForMember(userId, slug);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Idea deleted successfully.",
    data: result,
  });
});

export const ideaController = {
  purchaseIdea,
  purchaseIdeaWithPayLater,
  initiateIdeaPayment,
  createIdea,
  getMyIdeas,
  getMyIdeaById,
  updateMyIdea,
  deleteMyIdea,
  getAllIdeas,
  getIdeaById,
};
