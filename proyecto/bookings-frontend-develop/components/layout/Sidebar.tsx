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

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleClick}
              className={`admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""}`}
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