"use client";

import { useState } from "react";
import { useAuth, UserRole } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  // Estados de Login
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState<UserRole>("usuario"); // Por defecto usuario/cliente
  
  // Estado para alternar entre Login y Registro
  const [isRegistering, setIsRegistering] = useState(false);

  // Estados de Registro
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estados de Feedback
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
      const successLogin = await login(email, password, role);
      if (successLogin) {
        redirigirPorRol(role);
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
    setError(null);
    setSuccess(null);

    if (!nombre.trim()) { setError("Por favor, introduce tu nombre."); return; }
    if (!apellido.trim()) { setError("Por favor, introduce tu apellido."); return; }
    if (!regEmail.trim()) { setError("Por favor, introduce tu correo electrónico."); return; }
    if (!telefono.trim()) { setError("Por favor, introduce tu número de teléfono."); return; }
    if (!regPassword) { setError("Por favor, introduce tu contraseña."); return; }
    if (regPassword.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (regPassword !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }

    setLoading(true);

    try {
      await registerUser({
        nombre,
        apellido,
        email: regEmail,
        numero: telefono,
        password: regPassword,
      });

      setSuccess("¡Cuenta creada correctamente! Ya puedes iniciar sesión.");
      // Resetear campos de registro
      setNombre("");
      setApellido("");
      setRegEmail("");
      setTelefono("");
      setRegPassword("");
      setConfirmPassword("");
      
      // Ir a la vista de Login
      setIsRegistering(false);
      // Auto-rellenar email para facilitar el login
      setEmail(regEmail);
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al intentar registrar la cuenta.");
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

        {error && <div className="message-error" style={{ textAlign: "center" }}>{error}</div>}
        {success && <div className="message-success" style={{ textAlign: "center" }}>{success}</div>}

        {!isRegistering ? (
          /* Formulario de Login */
          <form onSubmit={handleLoginSubmit} className="login-form">
            <label className="login-label">
              Rol de Acceso
              <select className="login-input" value={role}
                onChange={(e) => { setRole(e.target.value as UserRole); setEmail(""); setPassword(""); }}
                style={{ background: "#211a4f" }}>
                <option value="usuario">Cliente Particular (Usuario)</option>
                <option value="empresa">Comercio / Negocio (Empresa)</option>
                <option value="admin">Administrador (Admin)</option>
              </select>
            </label>

            <label className="login-label">
              Email
              <input type="email" className="login-input" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@bookflow.com" required />
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
          </form>
        ) : (
          /* Formulario de Registro */
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="login-label">
                Nombre
                <input type="text" className="login-input" value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Carlos" required />
              </label>

              <label className="login-label">
                Apellido
                <input type="text" className="login-input" value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Gómez" required />
              </label>
            </div>

            <label className="login-label">
              Email
              <input type="email" className="login-input" value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="ejemplo@correo.com" required />
            </label>

            <label className="login-label">
              Teléfono
              <input type="tel" className="login-input" value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="600123456" required />
            </label>

            <label className="login-label">
              Contraseña
              <input type="password" className="login-input" value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" required />
            </label>

            <label className="login-label">
              Confirmar Contraseña
              <input type="password" className="login-input" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••" required />
            </label>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </button>
          </form>
        )}

        {/* Enlace para alternar entre Login y Registro */}
        <div style={{ textAlign: "center", marginTop: "8px" }}>
          {!isRegistering ? (
            <span style={{ fontSize: "14px", color: "var(--purple-100)", opacity: 0.8 }}>
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setError(null);
                  setSuccess(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--purple-200)",
                  textDecoration: "underline",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit"
                }}
              >
                Crear una
              </button>
            </span>
          ) : (
            <span style={{ fontSize: "14px", color: "var(--purple-100)", opacity: 0.8 }}>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError(null);
                  setSuccess(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--purple-200)",
                  textDecoration: "underline",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit"
                }}
              >
                Iniciar sesión
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}