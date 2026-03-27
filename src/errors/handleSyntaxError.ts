interface ISyntaxErrorResult {
  statusCode: number;
  name: string;
  code: string;
  message: string;
}

export const isSyntaxError = (err: unknown): err is SyntaxError =>
  err instanceof SyntaxError && "body" in err;

const handleSyntaxError = (): ISyntaxErrorResult => {
  return {
    statusCode: 400,
    name: "SyntaxError",
    code: "INVALID_JSON",
    message: "Invalid JSON payload.",
  };
};

export default handleSyntaxError;
