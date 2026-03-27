interface IJwtErrorResult {
  statusCode: number;
  name: string;
  code: string;
  message: string;
}

export const isJwtError = (err: unknown): err is Error =>
  err instanceof Error &&
  ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
    err.name,
  );

const handleJwtError = (error: Error): IJwtErrorResult => {
  switch (error.name) {
    case "JsonWebTokenError":
      return {
        statusCode: 401,
        name: "AuthError",
        code: "INVALID_TOKEN",
        message: "Invalid token.",
      };

    case "TokenExpiredError":
      return {
        statusCode: 401,
        name: "AuthError",
        code: "TOKEN_EXPIRED",
        message: "Token expired. Please login again.",
      };

    case "NotBeforeError":
      return {
        statusCode: 401,
        name: "AuthError",
        code: "TOKEN_NOT_ACTIVE",
        message: "Token not yet active.",
      };

    default:
      return {
        statusCode: 401,
        name: "AuthError",
        code: "AUTH_ERROR",
        message: "Authentication error.",
      };
  }
};

export default handleJwtError;
