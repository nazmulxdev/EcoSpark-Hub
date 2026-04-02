import { Request, Response } from "express";
import catchAsync from "../../shared/CatchAsync";
import AppResponse from "../../shared/AppResponse";

import status from "http-status";
import { ideaService } from "./idea.service";
import { IQueryParams } from "../../interfaces/query.interface";

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

const getAllIdeasForAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await ideaService.getAllIdeasForAdmin(
    req.query as IQueryParams,
  );

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Ideas retrieved successfully.",
    data: result,
  });
});

const getAllIdeasPublic = catchAsync(async (req: Request, res: Response) => {
  const result = await ideaService.getAllIdeasPublic(req.query as IQueryParams);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Ideas retrieved successfully.",
    data: result,
  });
});

const getMyPurchasedIdeas = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await ideaService.myPurchasedIdeas(userId);

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

const getMyDraftIdeas = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await ideaService.getDraftIdeasForMember(
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

const submitIdeaForAdminApproval = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const slug = req.params.slug as string;
    const result = await ideaService.submitIdeaForAdminApproval(userId, slug);

    AppResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Idea submitted successfully.",
      data: result,
    });
  },
);

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
  const user = req.user?.id as string;
  const result = await ideaService.getIdeaById(slug, user);

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

const checkPurchaseStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const ideaId = req.params.ideaId as string;
  const result = await ideaService.checkPurchaseStatus(userId, ideaId);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Purchase status checked successfully.",
    data: result,
  });
});

export const ideaController = {
  createIdea,
  getMyIdeas,
  getMyIdeaById,
  updateMyIdea,
  deleteMyIdea,
  getAllIdeasForAdmin,
  getAllIdeasPublic,
  getIdeaById,
  getMyDraftIdeas,
  submitIdeaForAdminApproval,
  getMyPurchasedIdeas,
  checkPurchaseStatus,
};
