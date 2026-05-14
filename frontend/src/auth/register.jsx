import { useState } from "react";
import { useAppContext } from "../context/context.jsx";

const Register = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const { registerUser, loginUser, loading, error } = useAppContext();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await registerUser(form);
      await loginUser({ email: form.email, password: form.password });
      if (onRegisterSuccess) onRegisterSuccess();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4 py-8">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100">
        {/* Left decorative panel */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-amber-100 via-amber-50 to-stone-100 p-10 relative">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-amber-600 text-white flex items-center justify-center font-bold">
                N
              </div>
              <span className="font-semibold text-stone-800">NoteApp</span>
            </div>

            <h2
              className="mt-16 text-4xl text-stone-800 leading-tight"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Start writing.
              <br />
              Keep your ideas close.
            </h2>
            <p className="mt-4 text-stone-600">
              A quiet space for your thoughts, lists, and reminders.
            </p>
          </div>

          <ul className="space-y-2 text-sm text-stone-600">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              Organize notes effortlessly
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              Sync across your sessions
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              Private and secure
            </li>
          </ul>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-10">
          <h2
            className="text-3xl text-stone-800 mb-1"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Create your account
          </h2>
          <p className="text-stone-500 mb-6">Takes less than a minute</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 bg-amber-50/40 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 bg-amber-50/40 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-3 py-2.5 bg-amber-50/40 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                placeholder="At least 6 characters"
              />
            </div>

            {(localError || error) && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {localError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-medium py-2.5 rounded-lg transition shadow-sm"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-sm text-stone-600 text-center mt-6">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-amber-700 hover:text-amber-800 hover:underline font-semibold"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
