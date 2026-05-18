// Componente Sidebar: Renderiza la barra lateral de navegación para la aplicación de administración.
// Funcionalidad:
// - Muestra una marca (brand) con título y subtítulo.
// - Renderiza una lista de enlaces de navegación basados en menuItems.
// - Resalta el enlace activo comparando la ruta actual con item.href usando usePathname.
// Propósito: Facilita la navegación entre secciones principales de la app (Dashboard, Bookings, etc.).
// Posibles mejoras:
// - Hacer menuItems configurable vía props para reutilización en diferentes contextos.
// - Añadir soporte para submenús o agrupaciones de enlaces.
// - Implementar animaciones de transición para el cambio de estado activo.
// - Mejorar accesibilidad con navegación por teclado y roles ARIA (ej. role="navigation").
// - Integrar permisos de usuario para mostrar/ocultar enlaces según roles.
// - Añadir indicadores de notificaciones o badges en los enlaces (ej. número de bookings pendientes).
//
// MEJORAS APLICADAS:
// 1. Tipo MenuItem definido con TypeScript para mayor robustez y validación de tipos.
// 2. menuItems extraído a defaultMenuItems como datos configurables vía props.
// 3. Interfaz SidebarProps agregada para permitir customización del componente:
//    - menuItems: array de MenuItem personalizado
//    - onNavigate: callback ejecutado al navegar entre secciones
//    - brandTitle y brandSubtitle: valores dinámicos para la marca del sidebar
// 4. Detección de ruta activa mejorada con startsWith para soportar rutas anidadas (/bookings/123).
// 5. Atributos ARIA agregados:
//    - role="navigation" en el aside para semántica apropiada
//    - aria-label="Main navigation" en el nav
//    - aria-current="page" en el link activo para lectores de pantalla
//    - aria-hidden="true" en los iconos para evitar redundancia en accesibilidad
// 6. onClick handler agregado con callback onNavigate para integración con estado global o analytics.
// 7. Clases específicas agregadas (admin-sidebar__icon, admin-sidebar__label) para mejor control estilístico.
//
// MEJORAS DE INTERACTIVIDAD AGREGADAS (Hover y Estado Activo) - 18/05/2026:
// 8. Efectos de hover mejorados:
//    - Cambio de color de fondo a var(--surface-2) para indicar interactividad
//    - Cambio de color de texto a var(--accent) para mayor contraste visual
//    - Borde izquierdo de 3px que aparece en hover con color de acento
//    - Transiciones suaves (0.2s) en background, color y border para feedback visual fluido
// 9. Icono mejorado con animación:
//    - Escala el icono a 110% (scale 1.1) en hover y estado activo para mayor énfasis
//    - Transiciones suaves para transformación y color
// 10. Etiqueta mejorada con cambios visuales:
//     - Aumenta font-weight a 600 en hover y estado activo para mayor contraste
//     - Ajusta letter-spacing para mejor legibilidad en estados interactivos
// 11. Estado activo altamente destacado:
//     - Combina fondo (var(--primary-soft)), color de texto (var(--accent)) y borde lateral
//     - Agrega sombra interna sutil con box-shadow para efecto de profundidad
//     - Todas las transiciones están coordinadas para un efecto visual cohesivo

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// APLICADO: Tipo MenuItem definido para mayor robustez con TypeScript.
type MenuItem = {
  label: string;
  href: string;
  icon: string;
  // Mejora futura: soportar badges para notificaciones, permisos de rol, etc.
};

// APLICADO: menuItems ahora es configurable vía props del componente.
// Mejora: extraído a datos externos para hacer el componente más reutilizable.
const defaultMenuItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "◫" },
  { label: "Bookings", href: "/bookings", icon: "☰" },
  { label: "Customers", href: "/customers", icon: "◎" },
  { label: "Payments", href: "/payments", icon: "◌" },
];

interface SidebarProps {
  // APLICADO: Props para hacer el componente reutilizable en diferentes contextos.
  menuItems?: MenuItem[];
  onNavigate?: (href: string) => void;
  brandTitle?: string;
  brandSubtitle?: string;
}

export default function Sidebar({
  menuItems = defaultMenuItems,
  onNavigate,
  brandTitle = "BookFlow",
  brandSubtitle = "Admin workspace",
}: SidebarProps) {
  const pathname = usePathname();
  // Comentario: usePathname es apropiado para detectar la ruta activa, pero para rutas anidadas convendría usar `startsWith`.
  // APLICADO: Se utiliza validación con startsWith para soportar rutas anidadas (ej. /bookings/123 se considera activa si el item es /bookings)

  return (
    <aside className="admin-sidebar" role="navigation">
      {/* APLICADO: role="navigation" agregado para mejorar accesibilidad con roles ARIA */}
      <div className="admin-sidebar__brand">
        <h2 className="admin-sidebar__title">{brandTitle}</h2>
        {/* APLICADO: Título dinámico configurable vía props para mayor reutilización del componente */}
        <p className="admin-sidebar__subtitle">{brandSubtitle}</p>
        {/* APLICADO: Subtítulo dinámico configurable vía props */}
      </div>

      <nav className="admin-sidebar__nav" aria-label="Main navigation">
        {/* APLICADO: aria-label aplicado para describir el propósito de la navegación */}
        {menuItems.map((item) => {
          // APLICADO: Detección de ruta activa mejorada usando startsWith para soportar rutas anidadas
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          
          // APLICADO: Callback onNavigate agregado para permitir acciones personalizadas al navegar
          const handleClick = () => {
            onNavigate?.(item.href);
          };

          // MEJORA APLICADA: Clases dinámicas para efecto hover y estado activo destacado
          // - Se agregan transiciones suaves y cambios visuales en hover
          // - El estado activo se destaca con color de fondo y bordes laterales
          const linkClasses = `admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""} admin-sidebar__link--hoverable`;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleClick}
              className={linkClasses}
              aria-current={isActive ? "page" : undefined}
            >
              {/* APLICADO: aria-current="page" agregado para indicar la página activa a lectores de pantalla */}
              {/* Mejora: usar iconos SVG o componentes de íconos en lugar de caracteres Unicode para mayor consistencia visual. */}
              {/* APLICADO: Estructura mejorada con clases específicas para mayor control estilístico y semántica */}
              <span className="admin-sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="admin-sidebar__label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {/* APLICADO: Mejora de accesibilidad - role="navigation" y aria-label agregados al nav */}
      {/* Nota: sería conveniente añadir un estado de carga o placeholder si la navegación depende de datos asíncronos. */}
    </aside>
  );
}