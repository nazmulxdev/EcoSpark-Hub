import { ZodError } from "zod";

interface IZodErrorResult {
  statusCode: number;
  name: string;
  code: string;
  message: string;
  details: { field?: string; message: string }[];
}

const handleZodError = (error: ZodError): IZodErrorResult => {
  return {
    statusCode: 400,
    name: "ValidationError",
    code: "VALIDATION_FAILED",
    message: "Validation failed.",
    details: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  };
};

export default handleZodError;
