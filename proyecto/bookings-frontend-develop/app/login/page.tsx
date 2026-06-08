"use client";

import { useState } from "react";
import { useAuth, UserRole } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();

  // Mode state: 'login' or 'register'
  const [mode, setMode] = useState<"login" | "register">("login");

  // Form states
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre]     = useState("");
  const [apellido, setApellido] = useState("");
  const [numero, setNumero]     = useState("");

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  // Función para decidir a dónde enviar al usuario según su rol
  const redirigirPorRol = (rolUsuario: UserRole) => {
    if (rolUsuario === "admin") {
      router.push("/dashboard");
    } else if (rolUsuario === "empresa") {
      router.push("/dashboard");
    } else if (rolUsuario === "usuario") {
      router.push("/bookings");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email)    { setError("Por favor, introduce tu correo electrónico."); return; }
    if (!password) { setError("Por favor, introduce tu contraseña."); return; }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const loggedUserRole = await login(email, password);
      if (loggedUserRole) {
        redirigirPorRol(loggedUserRole);
      } else {
        setError("Las credenciales ingresadas no son válidas.");
      }
    } catch {
      setError("Ocurrió un error al intentar iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre)   { setError("El nombre es obligatorio."); return; }
    if (!apellido) { setError("El apellido es obligatorio."); return; }
    if (!email)    { setError("El correo electrónico es obligatorio."); return; }
    if (!numero)   { setError("El teléfono es obligatorio."); return; }
    if (!password) { setError("La contraseña es obligatoria."); return; }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const ok = await register(nombre, apellido, email, numero, password);
      if (ok) {
        setSuccess("Registro completado con éxito. Ya puedes iniciar sesión.");
        setMode("login");
        // Clear fields except email/password so they can quickly login
        setNombre("");
        setApellido("");
        setNumero("");
      } else {
        setError("El registro falló. Es posible que el correo ya esté en uso o los datos no sean válidos.");
      }
    } catch {
      setError("Ocurrió un error al intentar registrarse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src="/logo-white.png" alt="Logo" style={{ height: "80px", width: "auto" }} />
        </div>

        {error && <div className="message-error" style={{ textAlign: "center" }}>{error}</div>}
        {success && <div className="message-success" style={{ textAlign: "center", color: "#4ade80", backgroundColor: "rgba(74, 222, 128, 0.15)", border: "1px solid #4ade80", borderRadius: "14px", padding: "12px 16px" }}>{success}</div>}

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <label className="login-label">
              Email
              <input type="email" className="login-input" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@turniagenidx.com" required />
            </label>

            <label className="login-label">
              Contraseña
              <input type="password" className="login-input" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </label>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>

            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <button type="button" onClick={() => { setMode("register"); setError(null); setSuccess(null); }} style={{ background: "none", border: "none", color: "var(--purple-200)", cursor: "pointer", fontSize: "14px", textDecoration: "underline" }}>
                ¿No tienes una cuenta? Regístrate como cliente
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <div style={{ display: "flex", gap: "10px" }}>
              <label className="login-label" style={{ flex: 1 }}>
                Nombre
                <input type="text" className="login-input" value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan" required />
              </label>

              <label className="login-label" style={{ flex: 1 }}>
                Apellido
                <input type="text" className="login-input" value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Pérez" required />
              </label>
            </div>

            <label className="login-label">
              Email
              <input type="email" className="login-input" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@ejemplo.com" required />
            </label>

            <label className="login-label">
              Teléfono
              <input type="text" className="login-input" value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="600123456" required />
            </label>

            <label className="login-label">
              Contraseña
              <input type="password" className="login-input" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </label>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Registrando..." : "Registrarse"}
            </button>

            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <button type="button" onClick={() => { setMode("login"); setError(null); setSuccess(null); }} style={{ background: "none", border: "none", color: "var(--purple-200)", cursor: "pointer", fontSize: "14px", textDecoration: "underline" }}>
                ¿Ya tienes cuenta? Inicia sesión aquí
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}