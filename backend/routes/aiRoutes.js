import express from "express";
import { suggest } from "../controllers/aiController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/ai/suggest", protect, suggest);

export default router;
