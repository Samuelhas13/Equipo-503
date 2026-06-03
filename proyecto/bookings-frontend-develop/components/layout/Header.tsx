// Componente Header: Renderiza el encabezado principal de la aplicación de administración.
// Funcionalidad: Muestra un título estático "Bookings Admin" y una descripción de la plataforma.
// Propósito: Proporciona una identidad visual y contextual en la parte superior de la interfaz.
// Posibles mejoras:
// - Aceptar props para título y subtítulo dinámicos (ej. props.title, props.subtitle).
// - Integrar un menú de usuario o acciones rápidas (ej. notificaciones, perfil).
// - Hacerlo responsive con estilos adaptativos para móviles.
// - Añadir accesibilidad con roles ARIA (ej. role="banner").
//
// MEJORAS APLICADAS (18/05/2026):
// 1. Props dinámicas agregadas:
//    - title: permite personalizar el título del header
//    - subtitle: permite personalizar el subtítulo
//    - actions?: ReactNode opcional para agregar botones, menús u otros elementos de acción
// 2. Interfaz HeaderProps definida para type-safety con TypeScript
// 3. Estilos inline reemplazados por clases CSS para mejor mantenimiento y reutilización
// 4. role="banner" agregado al elemento <header> para mejorar accesibilidad con screen readers
// 5. Estructura mejorada con contenedor separado para título/subtítulo vs acciones
// 6. Flexibilidad para agregar acciones dinámicamente (notificaciones, perfil, etc.)
// 7. Mejora responsive: layout flexbox que se adapta a diferentes tamaños de pantalla

"use client";

import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

// MEJORA APLICADA: Interfaz HeaderProps para mayor robustez y type-safety
// Permite que el componente sea reutilizable en diferentes contextos con datos dinámicos
interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

// MEJORA APLICADA: Props con valores por defecto para mantener compatibilidad
export default function Header({
  title = "Turnia gendix",
  subtitle = "Plataforma de gestión de reservas y cobros",
  actions,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const displayName = user?.name?.trim() || user?.email?.trim() || user?.role || "Usuario";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <header
      className="admin-header"
      role="banner"
    >
      {/* MEJORA APLICADA: Contenedor separado para título y subtítulo */}
      <div className="admin-header__content">
        <h1 className="admin-header__title">{title}</h1>
        <p className="admin-header__subtitle">{subtitle}</p>
      </div>

      {/* MEJORA APLICADA: Sección de acciones con perfil de usuario y botón de logout */}
      <div className="admin-header__actions" role="toolbar">
        {actions}
        
        {user && (
          <div className="user-profile-badge">
            <div className="admin-avatar">
              {avatarInitial}
            </div>
            <div className="user-profile-info">
              <span className="user-profile-name">{displayName}</span>
              <span className="user-profile-role">{user.role}</span>
            </div>
            <button 
              onClick={logout} 
              className="logout-btn-header"
              type="button"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
