import { Request, Response } from "express";
import catchAsync from "../../shared/CatchAsync";
import { ICreateBlog, IUpdateBlog } from "./blog.interface";
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

const getSingleBlog = catchAsync(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const result = await blogService.getSingleBlog(slug);
  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Blog fetched successfully",
    data: result,
  });
});

const updateBlog = catchAsync(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const payload = req.body as IUpdateBlog;
  console.log("payload", payload);
  console.log("file", req.file);
  if (req.file) {
    payload.coverImage = req.file.path as string;
  }
  console.log(payload);

  const result = await blogService.updateBlog(slug, payload);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Blog updated successfully",
    data: result,
  });
});

const deleteBlog = catchAsync(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const result = await blogService.deleteBlog(slug);
  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Blog deleted successfully",
    data: result,
  });
});

export const blogController = {
  createBlog,
  getAllBlogs,
  getSingleBlog,
  updateBlog,
  deleteBlog,
};
