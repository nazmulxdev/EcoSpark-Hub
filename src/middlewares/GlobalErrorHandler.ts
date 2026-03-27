import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import AppError from "../shared/AppError";

import { config } from "../config/env";
import {
  handleAppError,
  handleBetterAuthError,
  isBetterAuthError,
  handleJwtError,
  isJwtError,
  handleZodError,
  handleSyntaxError,
  isSyntaxError,
  handleNodeSystemError,
  isNodeSystemError,
} from "../errors/index";
import { handlePrismaError, isPrismaError } from "../errors/handlePrismaError";
import AppErrorResponse from "../shared/AppErrorResponse";
import { deleteUploadedFileFromGlobalErrorHandler } from "../utils/deleteUploadedFileFromGlobalErrorHandler";

const globalErrorHandler = async (
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  // Log in non-production only
  if (config.NODE_ENV !== "production") {
    console.error("\n[GlobalErrorHandler]:", error);
  }

  // delete file from cloudinary if occur error during uploading file

  await deleteUploadedFileFromGlobalErrorHandler(req);

  // 1. Custom AppError
  if (error instanceof AppError) {
    const result = handleAppError(error);
    AppErrorResponse(req, res, result, req.originalUrl);
    return;
  }

  // 2. Prisma errors
  if (isPrismaError(error)) {
    const result = handlePrismaError(error);
    AppErrorResponse(
      req,
      res,
      {
        statusCode: result.statusCode,
        name: "DatabaseError",
        code: result.code,
        message: result.message,
        ...(result.details !== null && {
          details: [{ message: JSON.stringify(result.details) }],
        }),
      },
      req.originalUrl,
    );
    return;
  }

  // 3. BetterAuth errors
  if (isBetterAuthError(error)) {
    const result = handleBetterAuthError(error);
    AppErrorResponse(req, res, result, req.originalUrl);
    return;
  }

  // 4. Zod validation errors
  if (error instanceof ZodError) {
    const result = handleZodError(error);
    AppErrorResponse(req, res, result, req.originalUrl);
    return;
  }

  // 5. JWT errors
  if (isJwtError(error)) {
    const result = handleJwtError(error);
    AppErrorResponse(req, res, result, req.originalUrl);
    return;
  }

  // 6. Syntax error (invalid JSON body)
  if (isSyntaxError(error)) {
    const result = handleSyntaxError();
    AppErrorResponse(req, res, result, req.originalUrl);
    return;
  }

  // 7. Node system errors
  if (isNodeSystemError(error)) {
    const result = handleNodeSystemError(error);
    AppErrorResponse(req, res, result, req.originalUrl);
    return;
  }

  // 8. Final fallback
  AppErrorResponse(
    req,
    res,
    {
      statusCode: 500,
      name: "InternalServerError",
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong. Please try again later.",
      ...(error instanceof Error &&
        error.stack !== undefined && { stack: error.stack }),
    },
    req.originalUrl,
  );
};

export default globalErrorHandler;
