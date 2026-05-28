"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // UI only
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
      const success = await login(email);
      if (!success) {
        setError("El correo electrónico ingresado no está registrado.");
      }
    } catch (err) {
      setError("Ocurrió un error al intentar iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const success = await login(userEmail);
      if (!success) {
        setError("Error al realizar el inicio de sesión rápido.");
      }
    } catch (err) {
      setError("Error al realizar el inicio de sesión rápido.");
    } finally {
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

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="quick-login-section">
          <h3 className="quick-login-title">Acceso rápido de prueba</h3>
          <div className="quick-login-grid">
            <div
              className="quick-login-card"
              onClick={() => handleQuickLogin("admin@bookflow.com")}
            >
              <span style={{ fontSize: "20px" }}>🛡️</span>
              <div className="quick-login-role">Admin</div>
              <div className="quick-login-name">Control Total</div>
            </div>

            <div
              className="quick-login-card"
              onClick={() => handleQuickLogin("nova@bookflow.com")}
            >
              <span style={{ fontSize: "20px" }}>💇</span>
              <div className="quick-login-role">Empresa 1</div>
              <div className="quick-login-name">P. Nova</div>
            </div>

            <div
              className="quick-login-card"
              onClick={() => handleQuickLogin("juan@bookflow.com")}
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
              onClick={() => handleQuickLogin("marea@bookflow.com")}
            >
              <span style={{ fontSize: "20px" }}>🍲</span>
              <div className="quick-login-role">Empresa 2</div>
              <div className="quick-login-name">Rest. Marea</div>
            </div>
            <div
              className="quick-login-card"
              onClick={() => handleQuickLogin("maria@bookflow.com")}
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
