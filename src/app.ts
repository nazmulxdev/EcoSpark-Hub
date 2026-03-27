import express, { Application, NextFunction, Request, Response } from "express";
import notFoundError from "./middlewares/NotFound";
import globalErrorHandler from "./middlewares/GlobalErrorHandler";
import cors from "cors";
import { config } from "./config/env";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { indexRoutes } from "./routes";

const app: Application = express();

// cors

app.use(
  cors({
    origin: [config.FRONTEND_URL as string, config.BETTER_AUTH_URL as string],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// cookie-parser
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// better-auth api routes

app.all(
  "/api/auth/*splat",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await toNodeHandler(auth)(req, res);
    } catch (err) {
      next(err);
    }
  },
);

// app routes

app.use("/api/v1", indexRoutes);

// root route

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to the EcoSpark Hub.",
    success: true,
    docs: "/api/v1/docs",
    status: "Running",
  });
});

// 404 error handler

app.use(notFoundError);

// global error handler

app.use(globalErrorHandler);

export default app;
