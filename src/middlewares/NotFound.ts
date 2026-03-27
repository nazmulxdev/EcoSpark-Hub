import { NextFunction, Request, Response } from "express";
import AppError from "../shared/AppError";

const notFoundError = (req: Request, res: Response, next: NextFunction) => {
  next(
    new AppError(
      404,
      `Can not ${req.method} from ${req.originalUrl} this path.`,
      "Error Path request",
      [
        {
          field: "Path",
          message: "Invalid path",
        },
      ],
    ),
  );
};

export default notFoundError;
