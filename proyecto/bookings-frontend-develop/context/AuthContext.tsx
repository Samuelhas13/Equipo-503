"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "empresa" | "usuario";

type RawUser = {
  id: number;
  nombre?: string;
  apellido?: string;
  name?: string;
  email: string;
  role: string;
  businessId?: number;
  customerId?: number;
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  businessId?: number;
  customerId?: number;
}

function normalizeRole(role: string): UserRole {
  const value = String(role).toLowerCase();
  if (value === "business" || value === "empresa") return "empresa";
  if (value === "customer" || value === "usuario") return "usuario";
  return "admin";
}

function mapUser(user: RawUser): User {
  const fullName = [user.name, user.nombre, user.apellido]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: user.id,
    name: fullName || user.email || "Usuario",
    email: user.email,
    role: normalizeRole(user.role),
    businessId: user.businessId,
    customerId: user.customerId,
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const MOCK_USERS = [
  { email: "admin@bookflow.com",  password: "admin123", name: "Administrador de Sistema", role: "admin"   as UserRole },
  { email: "nova@bookflow.com",   password: "nova123",  name: "Peluquería Nova",           role: "empresa" as UserRole, businessId: 1 },
  { email: "marea@bookflow.com",  password: "marea123", name: "Restaurante Marea",          role: "empresa" as UserRole, businessId: 2 },
  { email: "juan@bookflow.com",   password: "juan123",  name: "Juan Pérez",                 role: "usuario" as UserRole, customerId: 1 },
  { email: "maria@bookflow.com",  password: "maria123", name: "María López",                role: "usuario" as UserRole, customerId: 2 },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      if (typeof window === "undefined") { setLoading(false); return; }

      const storedToken = localStorage.getItem("bookflow_token");
      if (!storedToken) { setLoading(false); return; }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (res.ok) {
          const profile: RawUser = await res.json();
          setUser(mapUser(profile));
          setToken(storedToken);
        } else {
          localStorage.removeItem("bookflow_token");
          localStorage.removeItem("bookflow_user");
        }
      } catch {
        const stored = localStorage.getItem("bookflow_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUser(mapUser(parsed));
            setToken(storedToken);
          } catch {
            /* ignore */
          }
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      if (!res.ok) return false;

      const data: { access_token: string; token_type: string; expires_in: number; user: RawUser } = await res.json();

      setToken(data.access_token);
      setUser(mapUser(data.user));
      localStorage.setItem("bookflow_token", data.access_token);
      localStorage.setItem("bookflow_user", JSON.stringify(data.user));

      return true;
    } catch (err) {
      console.error("[AuthContext] Error en login:", err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("bookflow_token");
    localStorage.removeItem("bookflow_user");
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}