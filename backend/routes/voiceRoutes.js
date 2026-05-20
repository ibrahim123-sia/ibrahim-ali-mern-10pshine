import express from "express";
import { transcribe } from "../controllers/voiceController.js";
import { protect } from "../middlewares/auth.js";
import { uploadVoice } from "../middlewares/upload.js";

const router = express.Router();

router.post(
  "/voice/transcribe",
  protect,
  (req, res, next) => {
    uploadVoice(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  transcribe
);

export default router;
