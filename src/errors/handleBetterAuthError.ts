interface BetterAuthAPIError extends Error {
  status: string;
  statusCode: number;
  body: {
    code: string;
    message: string;
  };
}

interface IBetterAuthErrorResult {
  statusCode: number;
  name: string;
  code: string;
  message: string;
  details?: { field?: string; message: string }[];
}

export const isBetterAuthError = (err: unknown): err is BetterAuthAPIError =>
  err instanceof Error &&
  err.name === "APIError" &&
  "body" in err &&
  "statusCode" in err;

const handleBetterAuthError = (
  error: BetterAuthAPIError,
): IBetterAuthErrorResult => {
  const code = error.body?.code;

  switch (code) {
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
    case "EMAIL_ALREADY_EXISTS":
      return {
        statusCode: 409,
        name: "AuthError",
        message: "Email already registered.",
        code,
      };

    case "INVALID_CREDENTIALS":
      return {
        statusCode: 401,
        name: "AuthError",
        message: "Invalid email or password.",
        code,
      };

    case "USER_NOT_FOUND":
      return {
        statusCode: 404,
        name: "AuthError",
        message: "User not found.",
        code,
      };

    case "MISSING_OR_NULL_ORIGIN":
      return {
        statusCode: 403,
        name: "AuthError",
        message: "Origin not allowed.",
        code,
      };

    case "UNAUTHORIZED":
      return {
        statusCode: 401,
        name: "AuthError",
        message: "Unauthorized access.",
        code,
      };

    case "FORBIDDEN":
      return {
        statusCode: 403,
        name: "AuthError",
        message: "Access denied.",
        code,
      };

    case "SESSION_EXPIRED":
      return {
        statusCode: 401,
        name: "AuthError",
        message: "Session expired. Please login again.",
        code,
      };

    case "RATE_LIMIT_EXCEEDED":
      return {
        statusCode: 429,
        name: "AuthError",
        message: "Too many requests. Please try again later.",
        code,
      };

    case "VALIDATION_ERROR": {
      const matchedField = error.body?.message?.match(/\[body\.(.+?)\]/)?.[1];
      return {
        statusCode: 400,
        name: "AuthError",
        message: error.body?.message?.replace(/\[body\..+?\]\s*/, "") ?? "",
        code,
        details: [
          {
            ...(matchedField ? { field: matchedField } : {}),
            message: error.body?.message?.replace(/\[body\..+?\]\s*/, "") ?? "",
          },
        ],
      };
    }

    default:
      return {
        statusCode:
          error.statusCode >= 400 && error.statusCode < 600
            ? error.statusCode
            : 400,
        name: "AuthError",
        message:
          error.body?.message ?? error.message ?? "Authentication error.",
        code: code ?? "AUTH_ERROR",
      };
  }
};

export default handleBetterAuthError;
