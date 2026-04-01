import { Router } from "express";
import authMiddleware from "../../middlewares/AuthMiddelware";
import { usersController } from "./users.controller";

const router = Router();

router.get("/dashboard", authMiddleware(), usersController.getUserDashboard);

export const usersRoute = router;
