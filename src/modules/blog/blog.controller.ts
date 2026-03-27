import { Request, Response } from "express";
import catchAsync from "../../shared/CatchAsync";
import { ICreateBlog } from "./blog.interface";
import { blogService } from "./blog.service";
import AppResponse from "../../shared/AppResponse";
import { IQueryParams } from "../../interfaces/query.interface";

const createBlog = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const payload = req.body as ICreateBlog;
  if (req.file) {
    payload.coverImage = req.file.path as string;
  }
  console.log(payload);

  const result = await blogService.createBlog(userId, payload);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Blog created successfully",
    data: result,
  });
});

const getAllBlogs = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as IQueryParams;

  console.log(query);
  const result = await blogService.getAllBlogs(query);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Blogs fetched successfully",
    data: result,
  });
});

export const blogController = {
  createBlog,
  getAllBlogs,
};
