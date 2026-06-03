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
import { useLanguage } from "@/context/LanguageContext";
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
  const displayName = user?.name || [user?.nombre, user?.apellido].filter(Boolean).join(" ").trim() || user?.email || "Usuario";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  // Obtenemos el idioma global y la función para cambiarlo desde el contexto.
  // Esto permite que otros componentes también puedan usar el mismo idioma.
  const { language, changeLanguage } = useLanguage();

// El botón muestra el idioma actual: ES si está en español, EN si está en inglés.
const headerTexts = {
  es: {
    title: title,
    subtitle: subtitle,
    logout: "Salir",
    button: "ES",
  },
  en: {
    title: "Bookings Admin",
    subtitle: "Booking and payment management platform",
    logout: "Logout",
    button: "EN",
  },
};

  return (
    <header
      className="admin-header"
      role="banner"
    >
      {/* MEJORA APLICADA: Contenedor separado para título y subtítulo */}
      {/* Muestra el título y subtítulo según el idioma seleccionado */}
      <div className="admin-header__content">
        <h1 className="admin-header__title">{headerTexts[language].title}</h1>
      <p className="admin-header__subtitle">{headerTexts[language].subtitle}</p>
      </div>

      {/* MEJORA APLICADA: Sección de acciones con perfil de usuario y botón de logout */}
      <div className="admin-header__actions" role="toolbar">
        {actions}
        
        {/* Botón para cambiar entre español e inglés */}
      <button
        type="button"
        className="secondary-btn"
        onClick={changeLanguage}
      >
        {headerTexts[language].button}
      </button>

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
              {headerTexts[language].logout}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
