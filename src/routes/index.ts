import { Router } from "express";
import employeesRouter from "./employees.js";
import channelsRouter from "./channels.js";
import assetsRouter from "./assets.js";
import attendanceRouter from "./attendance.js";
import settingsRouter from "./settings.js";
import projectsRouter from "./projects.js";
import magicRouter from "./magic.js";
import authRouter from "./auth.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/employees", employeesRouter);
router.use("/channels", channelsRouter);
router.use("/assets", assetsRouter);
router.use("/attendance", attendanceRouter);
router.use("/settings", settingsRouter);
router.use("/projects", projectsRouter);
router.use("/magic", magicRouter);

export default router;
