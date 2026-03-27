/* eslint-disable @typescript-eslint/no-unused-vars */
interface ISyntaxErrorResult {
  statusCode: number;
  name: string;
  code: string;
  message: string;
  stack?: string;
}

export const isSyntaxError = (err: unknown): err is SyntaxError =>
  err instanceof SyntaxError &&
  ("body" in err ||
    err.message.includes("JSON") ||
    err.message.includes("Unexpected token") ||
    err.message.includes("Expected double-quoted"));

const handleSyntaxError = (err?: SyntaxError): ISyntaxErrorResult => {
  return {
    statusCode: 400,
    name: "SyntaxError",
    code: "INVALID_JSON",
    message: "Invalid JSON. Please check your request body.",
    ...(err?.stack !== undefined && { stack: err.stack }),
  };
};

export default handleSyntaxError;
