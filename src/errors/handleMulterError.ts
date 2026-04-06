import multer from "multer";

interface IMulterErrorResult {
  statusCode: number;
  name: string;
  code: string;
  message: string;
  stack?: string;
}

export const isMulterError = (err: unknown): err is multer.MulterError =>
  err instanceof multer.MulterError;

const handleMulterError = (err?: multer.MulterError): IMulterErrorResult => {
  let message = "File upload error";
  let code = "UPLOAD_ERROR";

  if (err?.code === "LIMIT_FILE_SIZE") {
    message = "File too large. Max size is 4MB.";
    code = "FILE_TOO_LARGE";
  } else if (err?.code === "LIMIT_FILE_COUNT") {
    message = "Too many files uploaded.";
    code = "TOO_MANY_FILES";
  } else if (err?.code === "LIMIT_UNEXPECTED_FILE") {
    message = "Unexpected file field.";
    code = "UNEXPECTED_FILE";
  }

  return {
    statusCode: 400,
    name: "MulterError",
    code,
    message,
    ...(err?.stack !== undefined && { stack: err.stack }),
  };
};

export default handleMulterError;
