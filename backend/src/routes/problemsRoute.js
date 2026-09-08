import express from "express";
import {
  getProblemsController,
  getProblemBySlugController,
} from "../controllers/problemsController.js";

const router = express.Router();

router.get("/", getProblemsController);
router.get("/:slug", getProblemBySlugController);

export default router;
