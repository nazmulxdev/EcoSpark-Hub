import AppError from "../shared/AppError";
import type { IErrorResponse } from "../shared/AppErrorResponse";

const handleAppError = (error: AppError): IErrorResponse => {
  return {
    statusCode: error.statusCode,
    name: error.name,
    message: error.message,
    ...(error.code !== undefined && { code: error.code }),
    ...(error.details !== undefined && { details: error.details }),
    ...(error.stack !== undefined && { stack: error.stack }),
  };
};

export default handleAppError;
