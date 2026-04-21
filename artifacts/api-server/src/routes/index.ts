import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import coursesRouter from "./courses";
import lecturesRouter from "./lectures";
import filesRouter from "./files";
import scheduleRouter from "./schedule";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(coursesRouter);
router.use(lecturesRouter);
router.use(filesRouter);
router.use(scheduleRouter);

export default router;
