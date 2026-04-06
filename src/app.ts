import express, { Application, NextFunction, Request, Response } from "express";
import notFoundError from "./middlewares/NotFound";
import globalErrorHandler from "./middlewares/GlobalErrorHandler";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { indexRoutes } from "./routes";
import qs from "qs";
import { paymentController } from "./modules/payment/payment.controller";

const app: Application = express();
app.set("trust proxy", true);

app.set("query parser", (str: string) => {
  return qs.parse(str);
});

// stripe web hoook

app.post(
  "/api/v1/payment/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleStripeWebhook,
);

app.use(
  cors({
    origin: [
      "https://ecospark-hub.vercel.app",
      "http://localhost:3000",
      "https://ecosoark-hub.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  }),
);

// cookie-parser
app.use(cookieParser());

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

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
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
