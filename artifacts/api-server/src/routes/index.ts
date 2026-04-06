import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contentRouter from "./content";
import authRouter from "./auth";
import paymentsRouter from "./payments";
import webhookRouter from "./webhook";
import feedbackRouter from "./feedback";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(contentRouter);
router.use(paymentsRouter);
router.use(webhookRouter);
router.use(feedbackRouter);

export default router;
