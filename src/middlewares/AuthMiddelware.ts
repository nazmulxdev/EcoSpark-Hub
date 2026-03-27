import { NextFunction, Request, Response } from "express";

import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { Role, UserStatus } from "../generated/prisma/enums";
import catchAsync from "../shared/CatchAsync";
import AppError from "../shared/AppError";

const authMiddleware = (...roles: Array<Role>) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    console.log(session);

    if (!session) {
      throw new AppError(
        401,
        "You are not authorized.",
        "Auth session failed",
        [
          {
            field: "Authentication",
            message: "You have to create account or login first.",
          },
        ],
      );
    }

    if (roles.length && !roles.includes(session.user.role as Role)) {
      throw new AppError(403, "Unauthorized access.", "Invalid request", [
        {
          field: "Authentication",
          message: "Please use valid identity token for access.",
        },
      ]);
    }

    if (session.user.userStatus === UserStatus.BANNED) {
      throw new AppError(
        403,
        "Your account has been banned by admin.",
        "ACCOUNT_BANNED",
        [
          {
            field: "Authentication",
            message:
              "You are not allowed to access the system. Please contact support.",
          },
        ],
      );
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as Role,
      status: session.user.userStatus as UserStatus,
    };

    next();
  });
};

export default authMiddleware;
