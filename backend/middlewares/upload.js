import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars");
const VOICE_DIR = path.join(process.cwd(), "uploads", "voice");
for (const dir of [AVATAR_DIR, VOICE_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const userId = req.user?._id?.toString() || "anon";
    const stamp = Date.now();
    cb(null, `${userId}-${stamp}${ext}`);
  },
});

const avatarFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Only JPEG, PNG, WEBP, or GIF images are allowed"));
};

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
}).single("avatar");

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VOICE_DIR),
  filename: (req, file, cb) => {
    // Force a known extension based on mimetype; browsers vary
    const mt = file.mimetype || "";
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext) {
      if (mt.includes("webm")) ext = ".webm";
      else if (mt.includes("ogg")) ext = ".ogg";
      else if (mt.includes("mp4")) ext = ".mp4";
      else if (mt.includes("mpeg")) ext = ".mp3";
      else if (mt.includes("wav")) ext = ".wav";
      else ext = ".webm";
    }
    const userId = req.user?._id?.toString() || "anon";
    const stamp = Date.now();
    cb(null, `${userId}-${stamp}${ext}`);
  },
});

const audioFilter = (req, file, cb) => {
  const allowed = [
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
  ];
  if (allowed.some((a) => file.mimetype?.toLowerCase().startsWith(a))) {
    return cb(null, true);
  }
  cb(new Error("Unsupported audio format"));
};

export const uploadVoice = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB (Groq Whisper hard limit)
}).single("audio");
