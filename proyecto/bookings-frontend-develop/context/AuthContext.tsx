"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "empresa" | "usuario";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  businessId?: number; // Only for "empresa"
  customerId?: number; // Only for "usuario"
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data list matching the implementation plan and DB
export const MOCK_USERS = [
  {
    email: "admin@bookflow.com",
    name: "Administrador de Sistema",
    role: "admin" as UserRole,
  },
  {
    email: "nova@bookflow.com",
    name: "Peluquería Nova",
    role: "empresa" as UserRole,
    businessId: 1,
  },
  {
    email: "marea@bookflow.com",
    name: "Restaurante Marea",
    role: "empresa" as UserRole,
    businessId: 2,
  },
  {
    email: "juan@bookflow.com",
    name: "Juan Pérez",
    role: "usuario" as UserRole,
    customerId: 1,
  },
  {
    email: "maria@bookflow.com",
    name: "María López",
    role: "usuario" as UserRole,
    customerId: 2,
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bookflow_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse stored user", e);
          localStorage.removeItem("bookflow_user");
        }
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string): Promise<boolean> => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        return false;
      }

      const loggedUser: User = await res.json();
      setUser(loggedUser);
      localStorage.setItem("bookflow_user", JSON.stringify(loggedUser));
      return true;
    } catch (e) {
      console.error("Login request failed", e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("bookflow_user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
