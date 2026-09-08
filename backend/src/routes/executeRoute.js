import express from "express";
import { executeCodeController } from "../controllers/executeController.js";

const router = express.Router();

router.post("/", executeCodeController);

export default router;
