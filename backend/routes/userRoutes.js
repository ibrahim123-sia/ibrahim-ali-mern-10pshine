import {registerUser,loginUser,getProfile} from "../controllers/userController.js";
import express from "express";
import { protect } from "../middlewares/auth.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getProfile", protect, getProfile);

export default router;