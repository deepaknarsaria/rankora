import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contentRouter from "./content";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(contentRouter);

export default router;
