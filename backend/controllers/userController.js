import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const registerUser=async(req,res)=>{
    const {name,email,password}=req.body;
    try {
        const user=await User.create({name,email,password});
        res.status(201).json({_id:user._id,name:user.name,email:user.email,createdAt:user.createdAt});
    } catch (error) {
        res.status(400).json({message:error.message});
    }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        const token = generateToken(user._id);
        return res.json({ success: true, token });
      }
    }

    return res.status(401).json({ success: false, message: "invalid email and password" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};