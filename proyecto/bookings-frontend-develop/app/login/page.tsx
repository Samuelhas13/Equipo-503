"use client";

import { useState } from "react";
import { useAuth, UserRole, MOCK_USERS } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // UI only
  const [role, setRole] = useState<UserRole>("admin");
  const [extraId, setExtraId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor, introduce tu correo electrónico.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await login(email, role, extraId ? Number(extraId) : undefined);
      if (!success) {
        setError("Las credenciales ingresadas no son válidas.");
      }
    } catch (err) {
      setError("Ocurrió un error al intentar iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, userRole: UserRole, customId?: number) => {
    setLoading(true);
    setError(null);
    try {
      await login(userEmail, userRole, customId);
    } catch (err) {
      setError("Error al realizar el inicio de sesión rápido.");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-brand">BookFlow</h1>
          <p className="login-tagline">Plataforma Inteligente de Reservas</p>
        </div>

        {error && (
          <div className="message-error" style={{ textAlign: "center" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            Rol de Acceso
            <select
              className="login-input"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as UserRole);
                // Clear inputs if switching roles to avoid confusion
                setEmail("");
                setExtraId("");
              }}
              style={{ background: "#211a4f" }}
            >
              <option value="admin">Administrador (Admin)</option>
              <option value="empresa">Comercio / Negocio (Empresa)</option>
              <option value="usuario">Cliente Particular (Usuario)</option>
            </select>
          </label>

          <label className="login-label">
            Email
            <input
              type="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@bookflow.com"
              required
            />
          </label>

          <label className="login-label">
            Contraseña
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {role !== "admin" && (
            <label className="login-label">
              ID Personalizado (Opcional)
              <input
                type="number"
                className="login-input"
                value={extraId}
                onChange={(e) => setExtraId(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={role === "empresa" ? "ID de Empresa (ej. 1)" : "ID de Cliente (ej. 1)"}
              />
            </label>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="quick-login-section">
          <h3 className="quick-login-title">Acceso rápido de prueba</h3>
          <div className="quick-login-grid">
            <div
              className="quick-login-card"
              onClick={() => handleQuickLogin("admin@bookflow.com", "admin")}
            >
              <span style={{ fontSize: "20px" }}>🛡️</span>
              <div className="quick-login-role">Admin</div>
              <div className="quick-login-name">Control Total</div>
            </div>

            <div
              className="quick-login-card"
              onClick={() => handleQuickLogin("nova@bookflow.com", "empresa", 1)}
            >
              <span style={{ fontSize: "20px" }}>💇</span>
              <div className="quick-login-role">Empresa 1</div>
              <div className="quick-login-name">P. Nova</div>
            </div>

            <div
              className="quick-login-card"
              onClick={() => handleQuickLogin("juan@bookflow.com", "usuario", 1)}
            >
              <span style={{ fontSize: "20px" }}>👤</span>
              <div className="quick-login-role">Usuario 1</div>
              <div className="quick-login-name">Juan Pérez</div>
            </div>
          </div>

          <div className="quick-login-grid" style={{ marginTop: "8px" }}>
            <div style={{ visibility: "hidden" }}></div>
            <div
              className="quick-login-card"
              onClick={() => handleQuickLogin("marea@bookflow.com", "empresa", 2)}
            >
              <span style={{ fontSize: "20px" }}>🍲</span>
              <div className="quick-login-role">Empresa 2</div>
              <div className="quick-login-name">Rest. Marea</div>
            </div>
            <div
              className="quick-login-card"
              onClick={() => handleQuickLogin("maria@bookflow.com", "usuario", 2)}
            >
              <span style={{ fontSize: "20px" }}>👤</span>
              <div className="quick-login-role">Usuario 2</div>
              <div className="quick-login-name">María López</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
