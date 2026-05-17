import express from "express";
import {
    suggest,
    generateFlashcards,
    generateQuiz,
} from "../controllers/aiController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/ai/suggest", protect, suggest);
router.post("/ai/flashcards", protect, generateFlashcards);
router.post("/ai/quiz", protect, generateQuiz);

export default router;
