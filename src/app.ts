import express, { Application, Request, Response } from "express";
import notFoundError from "./middlewares/NotFound";
import globalErrorHandler from "./middlewares/GlobalErrorHandler";

const app: Application = express();

// root route

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to EcoSpark Hub.");
});

// 404 error handler

app.use(notFoundError);

// global error handler

app.use(globalErrorHandler);

export default app;
