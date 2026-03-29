import { Server } from "http";
import app from "./app.js";
import { config } from "./config/env.js";
import { seedAdmin } from "./utils/seed.js";
import { startPaymentCronJobs } from "./modules/payment/payment.cron.js";

const port = config.PORT;
let server: Server;

const bootStrap = async () => {
  try {
    await seedAdmin();
    startPaymentCronJobs();
    server = app.listen(port, () => {
      console.log("This server is running on the port :", port);
    });
  } catch (error) {
    console.error(error);
  }
};

const gracefulShutdown = (signal: string) => {
  console.log(`⚠️ ${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(() => {
      console.log("💤 Server closed successfully.");
      process.exit(0);
    });
  } else {
    process.exit(1);
  }
};

// Signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Uncaught Exception
process.on("uncaughtException", (error: unknown) => {
  console.error("❌ Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

// Unhandled Rejection
process.on("unhandledRejection", (reason: unknown) => {
  console.error("❌ Unhandled Rejection:", reason);
  gracefulShutdown("unhandledRejection");
});

bootStrap();
