import { Request, Response } from "express";
import status from "http-status";
import AppResponse from "../../shared/AppResponse";
import catchAsync from "../../shared/CatchAsync";
import { adminService } from "./admin.service";

// ── Dashboard ─────────────────────────────────────────────────────────────────
const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await adminService.getDashboardStats();

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Dashboard statistics retrieved successfully.",
    data: result,
  });
});

// ── Users ─────────────────────────────────────────────────────────────────────
const getAllUsers = catchAsync(async (_req: Request, res: Response) => {
  const result = await adminService.getAllUsers();

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Users retrieved successfully.",
    data: result,
  });
});

const changeUserStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const result = await adminService.changeUserStatus(userId, req.body);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User status updated successfully.",
    data: result,
  });
});

// ── Members ───────────────────────────────────────────────────────────────────
const getAllMembers = catchAsync(async (_req: Request, res: Response) => {
  const result = await adminService.getAllMembers();

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Members retrieved successfully.",
    data: result,
  });
});

const changeMemberStatus = catchAsync(async (req: Request, res: Response) => {
  const memberId = req.params.memberId as string;
  const result = await adminService.changeMemberStatus(memberId, req.body);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Member status updated successfully.",
    data: result,
  });
});

// ── Ideas ─────────────────────────────────────────────────────────────────────
const getAllIdeasForAdmin = catchAsync(async (_req: Request, res: Response) => {
  const result = await adminService.getAllIdeasForAdmin();

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Ideas retrieved successfully.",
    data: result,
  });
});

const changeIdeaStatus = catchAsync(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const result = await adminService.changeIdeaStatus(slug, req.body);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Idea status updated successfully.",
    data: result,
  });
});

export const adminController = {
  getDashboardStats,
  getAllUsers,
  changeUserStatus,
  getAllMembers,
  changeMemberStatus,
  getAllIdeasForAdmin,
  changeIdeaStatus,
};
