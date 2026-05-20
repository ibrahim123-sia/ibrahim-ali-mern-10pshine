import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../configs/logger.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    logger.error({ err: error, email }, "register user failed");
    res.status(500).json({ message: "Server error" });
  }
};


export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
      const isMatch = await user.matchPassword(password);

      if (isMatch) {
        const token = generateToken(user._id);
        logger.info({userId: user._id.toString(),email},"user login successful")
        return res.json({success:true,token})

      }
    }

    logger.warn({email},"user login fail: invalid email password")
    return res.json({ success: false, message: "invalid email and password" });
  } catch (error) {
    logger.error({err:error,email},"login user fail")
    return res.json({ success: false, message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  logger.info({ userId: req.user?._id?.toString() }, "user logout");
  return res.json({ success: true, message: "logged out" });
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profileImage: user.profileImage || "",
  theme: user.theme || "light",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const updateProfile = async (req, res) => {
  try {
    const { name, theme } = req.body;
    const update = {};
    if (typeof name === "string") {
      const trimmed = name.trim();
      if (trimmed.length < 1) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      update.name = trimmed;
    }
    if (typeof theme === "string") {
      if (!["light", "dark"].includes(theme)) {
        return res.status(400).json({ message: "Theme must be 'light' or 'dark'" });
      }
      update.theme = theme;
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }
    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    logger.info({ userId: user._id.toString() }, "profile updated");
    return res.json(sanitizeUser(user));
  } catch (error) {
    logger.error({ err: error, userId: req.user?._id?.toString() }, "update profile failed");
    return res.status(500).json({ message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      logger.warn({ userId: user._id.toString() }, "change password failed: wrong current password");
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    user.password = newPassword; // pre-save hook re-hashes
    await user.save();
    logger.info({ userId: user._id.toString() }, "password changed");
    return res.json({ success: true, message: "Password updated" });
  } catch (error) {
    logger.error({ err: error, userId: req.user?._id?.toString() }, "change password failed");
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const url = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: url },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    logger.info({ userId: user._id.toString(), file: req.file.filename }, "avatar updated");
    return res.json(sanitizeUser(user));
  } catch (error) {
    logger.error({ err: error, userId: req.user?._id?.toString() }, "update avatar failed");
    return res.status(500).json({ message: "Server error" });
  }
};