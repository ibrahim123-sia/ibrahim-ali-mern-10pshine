import User from "../models/User";

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
    res.status(500).json({ message: "Server error" });
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

    return res.json({ success: false, message: "invalid email and password" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};