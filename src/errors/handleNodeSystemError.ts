interface NodeSystemError extends Error {
  code: string;
  syscall?: string;
}

interface INodeSystemErrorResult {
  statusCode: number;
  name: string;
  code: string;
  message: string;
}

export const isNodeSystemError = (err: unknown): err is NodeSystemError =>
  err instanceof Error &&
  "code" in err &&
  typeof (err as NodeSystemError).code === "string" &&
  (err as NodeSystemError).code.startsWith("E");

const handleNodeSystemError = (
  error: NodeSystemError,
): INodeSystemErrorResult => {
  switch (error.code) {
    case "ECONNREFUSED":
      return {
        statusCode: 503,
        name: "SystemError",
        code: error.code,
        message: "Service connection refused.",
      };

    case "ENOTFOUND":
      return {
        statusCode: 503,
        name: "SystemError",
        code: error.code,
        message: "Service not found.",
      };

    case "ETIMEDOUT":
      return {
        statusCode: 504,
        name: "SystemError",
        code: error.code,
        message: "Request timed out.",
      };

    case "ECONNRESET":
      return {
        statusCode: 503,
        name: "SystemError",
        code: error.code,
        message: "Connection reset.",
      };

    case "EPIPE":
      return {
        statusCode: 503,
        name: "SystemError",
        code: error.code,
        message: "Broken pipe error.",
      };

    default:
      return {
        statusCode: 500,
        name: "SystemError",
        code: error.code,
        message: error.message || "System error.",
      };
  }
};

export default handleNodeSystemError;
