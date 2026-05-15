import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  Check,
  Lock,
  User as UserIcon,
  X,
} from "lucide-react";
import { useAppContext } from "../context/context.jsx";
import Logo from "../components/Logo.jsx";

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const resolveAvatarUrl = (path) =>
  !path ? "" : path.startsWith("http") ? path : `${API_ORIGIN}${path}`;

const Notice = ({ type, children, onDismiss }) => {
  if (!children) return null;
  const styles =
    type === "error"
      ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
      : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
  return (
    <div
      className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg border ${styles}`}
    >
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const { user, updateProfile, changePassword, uploadAvatar } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileErr, setProfileErr] = useState(null);

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [pwErr, setPwErr] = useState(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarErr, setAvatarErr] = useState(null);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarErr(null);
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarErr("Image must be JPEG, PNG, WEBP, or GIF.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarErr("Image must be 2 MB or smaller.");
      return;
    }
    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
    } catch (err) {
      setAvatarErr(err.message || "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setProfileErr("Name cannot be empty.");
      return;
    }
    if (trimmed === (user?.name || "")) {
      setProfileMsg("No changes to save.");
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ name: trimmed });
      setProfileMsg("Profile updated.");
    } catch (err) {
      setProfileErr(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    setPwErr(null);
    const { currentPassword, newPassword, confirmPassword } = pwForm;
    if (!currentPassword || !newPassword) {
      setPwErr("Both current and new password are required.");
      return;
    }
    if (newPassword.length < 6) {
      setPwErr("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErr("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setPwErr("New password must be different from the current one.");
      return;
    }
    setPwSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPwMsg("Password updated.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwErr(err.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  const avatarSrc = resolveAvatarUrl(user?.profileImage);
  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-amber-50/40 dark:bg-stone-950 text-stone-800 dark:text-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 dark:bg-stone-900/70 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Logo size="sm" />
          <span className="text-stone-400 dark:text-stone-600">/</span>
          <h1 className="text-base font-medium text-stone-700 dark:text-stone-200">
            Profile
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Avatar section */}
        <section className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2
            className="text-xl text-stone-800 dark:text-stone-100 mb-1"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Your photo
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">
            JPEG, PNG, WEBP, or GIF · up to 2 MB
          </p>
          <div className="flex items-center gap-5">
            <div className="relative">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user?.name || "Avatar"}
                  className="w-20 h-20 rounded-full object-cover border border-stone-200 dark:border-stone-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center text-2xl font-semibold">
                  {initial}
                </div>
              )}
              <button
                onClick={handleAvatarPick}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white flex items-center justify-center shadow-md transition"
                aria-label="Change avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <button
                onClick={handleAvatarPick}
                disabled={avatarUploading}
                className="px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg transition disabled:opacity-50"
              >
                {avatarUploading ? "Uploading…" : "Upload new photo"}
              </button>
              {avatarErr && (
                <div className="mt-2">
                  <Notice type="error" onDismiss={() => setAvatarErr(null)}>
                    {avatarErr}
                  </Notice>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </section>

        {/* Profile details */}
        <section className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <UserIcon className="w-5 h-5 text-stone-500" />
            <h2
              className="text-xl text-stone-800 dark:text-stone-100"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Profile details
            </h2>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">
            Your name is visible across NoWrite. Email is fixed for your account.
          </p>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Display name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-amber-50/40 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-800 dark:text-stone-100"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                readOnly
                className="w-full px-3 py-2.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-500 dark:text-stone-500 cursor-not-allowed"
              />
            </div>

            {(profileErr || profileMsg) && (
              <Notice
                type={profileErr ? "error" : "success"}
                onDismiss={() => {
                  setProfileErr(null);
                  setProfileMsg(null);
                }}
              >
                {profileErr || (
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4" /> {profileMsg}
                  </span>
                )}
              </Notice>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 rounded-lg shadow-sm transition"
              >
                {savingProfile ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </section>

        {/* Password */}
        <section className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5 text-stone-500" />
            <h2
              className="text-xl text-stone-800 dark:text-stone-100"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Change password
            </h2>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">
            Use at least 6 characters. A strong password is a good password.
          </p>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Current password
              </label>
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) =>
                  setPwForm((f) => ({ ...f, currentPassword: e.target.value }))
                }
                autoComplete="current-password"
                className="w-full px-3 py-2.5 bg-amber-50/40 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-800 dark:text-stone-100"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  New password
                </label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, newPassword: e.target.value }))
                  }
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 bg-amber-50/40 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-800 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))
                  }
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 bg-amber-50/40 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-800 dark:text-stone-100"
                />
              </div>
            </div>

            {(pwErr || pwMsg) && (
              <Notice
                type={pwErr ? "error" : "success"}
                onDismiss={() => {
                  setPwErr(null);
                  setPwMsg(null);
                }}
              >
                {pwErr || (
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4" /> {pwMsg}
                  </span>
                )}
              </Notice>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pwSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 rounded-lg shadow-sm transition"
              >
                {pwSaving ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
