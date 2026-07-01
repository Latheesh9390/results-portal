import { createContext, useContext, useState } from "react";
import { adminLogin, adminRegister } from "../api/adminApi";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("admin_token"));
  const [username, setUsername] = useState(() => localStorage.getItem("admin_username"));

  async function login(credentials) {
    const data = await adminLogin(credentials);
    localStorage.setItem("admin_token", data.access_token);
    localStorage.setItem("admin_username", data.username);
    setToken(data.access_token);
    setUsername(data.username);
  }

  async function register(details) {
    // Registration logs the new admin straight in, same as login() does.
    const data = await adminRegister(details);
    localStorage.setItem("admin_token", data.access_token);
    localStorage.setItem("admin_username", data.username);
    setToken(data.access_token);
    setUsername(data.username);
  }

  function logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_username");
    setToken(null);
    setUsername(null);
  }

  const value = { token, username, isAuthenticated: Boolean(token), login, register, logout };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used inside an AdminAuthProvider");
  }
  return ctx;
}
