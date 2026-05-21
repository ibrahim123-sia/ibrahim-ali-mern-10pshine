import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../configs/logger.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    logger.warn({ err: error.message }, "auth token verification failed");
    return res.status(401).json({ message: "Not authorized token failed" });
  }
};
