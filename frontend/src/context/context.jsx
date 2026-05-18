import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const TOKEN_KEY = "token";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
    });
    instance.interceptors.request.use((config) => {
      const t = localStorage.getItem(TOKEN_KEY);
      if (t) config.headers.Authorization = `Bearer ${t}`;
      return config;
    });
    return instance;
  }, []);

  const handleError = (err) => {
    const message =
      err?.response?.data?.message || err?.message || "Something went wrong";
    setError(message);
    throw new Error(message);
  };

  // ---------------- USER APIs ----------------
  const registerUser = useCallback(
    async ({ name, email, password }) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post("/users/register", { name, email, password });
        return data;
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const loginUser = useCallback(
    async ({ email, password }) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post("/users/login", { email, password });
        if (data?.success && data?.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
          setTokenState(data.token);
        } else {
          throw new Error(data?.message || "Invalid email or password");
        }
        return data;
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const logoutUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/users/logout");
      return data;
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setTokenState(null);
      setUser(null);
      setNotes([]);
      setLoading(false);
    }
  }, [api]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/users/profile");
      setUser(data);
      return data;
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const updateProfile = useCallback(
    async ({ name, theme }) => {
      setLoading(true);
      setError(null);
      try {
        const payload = {};
        if (typeof name === "string") payload.name = name;
        if (typeof theme === "string") payload.theme = theme;
        const { data } = await api.put("/users/profile", payload);
        setUser(data);
        return data;
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const changePassword = useCallback(
    async ({ currentPassword, newPassword }) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.put("/users/password", {
          currentPassword,
          newPassword,
        });
        return data;
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const uploadAvatar = useCallback(
    async (file) => {
      setLoading(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("avatar", file);
        const { data } = await api.post("/users/avatar", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setUser(data);
        return data;
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  // ---------------- NOTE APIs ----------------
  const createNote = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post("/notes", payload);
        setNotes((prev) => [data, ...prev]);
        return data;
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const getUserNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/notes");
      setNotes(data || []);
      return data;
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const getNoteById = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/notes/${id}`);
        return data;
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const updateNote = useCallback(
    async (id, payload) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.put(`/notes/${id}`, payload);
        setNotes((prev) => prev.map((n) => (n._id === id ? data : n)));
        return data;
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  // Convenience helpers for single-field toggles
  const patchNote = useCallback(
    async (id, partial) => updateNote(id, partial),
    [updateNote]
  );

  // ---------------- CATEGORY APIs ----------------
  const getCategories = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get("/categories");
      setCategories(data || []);
      return data;
    } catch (err) {
      handleError(err);
    }
  }, [api]);

  const createCategory = useCallback(
    async ({ name, color, icon }) => {
      setError(null);
      try {
        const { data } = await api.post("/categories", { name, color, icon });
        setCategories((prev) =>
          [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
        );
        return data;
      } catch (err) {
        handleError(err);
      }
    },
    [api]
  );

  const updateCategory = useCallback(
    async (id, payload) => {
      setError(null);
      try {
        const { data } = await api.put(`/categories/${id}`, payload);
        setCategories((prev) =>
          prev
            .map((c) => (c._id === id ? data : c))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        return data;
      } catch (err) {
        handleError(err);
      }
    },
    [api]
  );

  const deleteCategory = useCallback(
    async (id) => {
      setError(null);
      try {
        await api.delete(`/categories/${id}`);
        setCategories((prev) => prev.filter((c) => c._id !== id));
        // Clear category from any cached notes that referenced it
        setNotes((prev) =>
          prev.map((n) => (n.category === id ? { ...n, category: null } : n))
        );
      } catch (err) {
        handleError(err);
      }
    },
    [api]
  );

  const deleteNote = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.delete(`/notes/${id}`);
        setNotes((prev) => prev.filter((n) => n._id !== id));
        return data;
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  useEffect(() => {
    if (token && !user) {
      fetchProfile().catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setTokenState(null);
      });
    }
  }, [token, user, fetchProfile]);

  const value = {
    user,
    token,
    notes,
    categories,
    loading,
    error,
    isAuthenticated: !!token,
    registerUser,
    loginUser,
    logoutUser,
    fetchProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    createNote,
    getUserNotes,
    getNoteById,
    updateNote,
    patchNote,
    deleteNote,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within an AppProvider");
  return ctx;
};
