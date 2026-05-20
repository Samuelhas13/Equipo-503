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

// MEJORA APLICADA: Interfaz HeaderProps para mayor robustez y type-safety
// Permite que el componente sea reutilizable en diferentes contextos con datos dinámicos
interface HeaderProps {
  // MEJORA: Título dinámico en lugar de texto hardcoded
  title?: string;
  // MEJORA: Subtítulo dinámico en lugar de texto hardcoded
  subtitle?: string;
  // MEJORA: Soporte para acciones del header (botones, menús, notificaciones)
  actions?: ReactNode;
}

// MEJORA APLICADA: Props con valores por defecto para mantener compatibilidad
export default function Header({
  title = "Bookings Admin",
  subtitle = "Plataforma de gestión de reservas y cobros",
  actions,
}: HeaderProps) {
  // Mejora: aceptar props para título y subtítulo dinámicos, en lugar de texto estático.
  // Esto permitiría reutilizar el componente en otras secciones de la app.
  return (
    <header
      className="admin-header"
      role="banner"
      // MEJORA APLICADA: role="banner" agregado para indicar que es el encabezado principal de la página
      // Esto mejora la accesibilidad con lectores de pantalla y navegadores
    >
      {/* MEJORA APLICADA: Contenedor separado para título y subtítulo */}
      {/* Esto permite mejor control del layout y separación de responsabilidades */}
      <div className="admin-header__content">
        {/* Usar clases CSS en lugar de estilos inline puede mejorar el mantenimiento y evitar duplicación. */}
        {/* MEJORA APLICADA: Título dinámico mediante props en lugar de hardcoded */}
        <h1 className="admin-header__title">{title}</h1>
        {/* MEJORA APLICADA: Subtítulo dinámico mediante props en lugar de hardcoded */}
        <p className="admin-header__subtitle">{subtitle}</p>
        {/* Posible mejora: agregar un botón de acción o breadcrumb si el dashboard tiene navegación secundaria. */}
      </div>

      {/* MEJORA APLICADA: Sección de acciones para soportar menús de usuario, notificaciones, etc. */}
      {actions && (
        <div className="admin-header__actions" role="toolbar">
          {/* MEJORA: role="toolbar" agregado para accesibilidad - indica que contiene controles interactivos */}
          {actions}
        </div>
      )}
    </header>
  );
}