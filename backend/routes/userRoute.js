import { registerUser, loginUser, logoutUser } from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";
import express from "express";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/profile", protect, (req, res) => {
  res.json(req.user);
});

export default router;
