import { registerUser,loginUser } from "../controllers/userController";
import { protect } from "../middlewares/auth";
import express from "express";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login",protect, loginUser);
router.get("/profile", protect, (req, res) => {
  res.json(req.user);
});