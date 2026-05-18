import {
  registerUser,
  loginUser,
  logoutUser,
  updateProfile,
  changePassword,
  updateAvatar,
} from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";
import { uploadAvatar } from "../middlewares/upload.js";
import express from "express";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/profile", protect, (req, res) => {
  res.json(req.user);
});

router.put("/profile", protect, updateProfile);
router.put("/password", protect, changePassword);
router.post(
  "/avatar",
  protect,
  (req, res, next) => {
    uploadAvatar(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  updateAvatar
);

export default router;
