import { Request, Response } from "express";
import { config } from "../config/env";

interface IErrorDetail {
  field?: string;
  message: string;
}

interface IErrorResponse {
  statusCode: number;
  name: string;
  code?: string;
  message: string;
  details?: IErrorDetail[];
  stack?: string;
  isOperational?: boolean;
}

const AppErrorResponse = (
  req: Request,
  res: Response,
  error: IErrorResponse,
  path: string,
) => {
  const isDev = config.NODE_ENV === "development";

  return res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    name: error.name,
    code: error.code,
    message: error.message,
    ...(error.details !== undefined &&
      error.details.length > 0 && { details: error.details }),
    path,
    timestamp: new Date().toISOString(),
    requestId: req.headers["x-request-id"] ?? crypto.randomUUID(),
    ...(isDev && { stack: error.stack }),
  });
};

export default AppErrorResponse;

export type { IErrorResponse, IErrorDetail };
