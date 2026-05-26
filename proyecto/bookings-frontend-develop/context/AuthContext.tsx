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
  login: (email: string, role: UserRole, extraId?: number) => Promise<boolean>;
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

  const login = async (email: string, role: UserRole, extraId?: number): Promise<boolean> => {
    // Simple client-side mock authentication logic
    const matched = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role
    );

    if (matched) {
      const newUser: User = {
        id: matched.role === "admin" ? 999 : (matched.businessId || matched.customerId || 1),
        name: matched.name,
        email: matched.email,
        role: matched.role,
        businessId: matched.businessId,
        customerId: matched.customerId,
      };

      setUser(newUser);
      localStorage.setItem("bookflow_user", JSON.stringify(newUser));
      return true;
    }

    // Fallback/Custom credentials for testing other IDs manually
    const generatedUser: User = {
      id: extraId || 100,
      name: role === "empresa" ? `Comercio #${extraId || 100}` : `Cliente #${extraId || 100}`,
      email: email,
      role: role,
      businessId: role === "empresa" ? (extraId || 100) : undefined,
      customerId: role === "usuario" ? (extraId || 100) : undefined,
    };

    setUser(generatedUser);
    localStorage.setItem("bookflow_user", JSON.stringify(generatedUser));
    return true;
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
