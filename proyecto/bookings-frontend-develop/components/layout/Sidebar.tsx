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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Posible mejora: extraer menuItems a datos externos o props para hacer el componente más reutilizable.
// También se podría utilizar un tipo `MenuItem` para mayor robustez con TypeScript.
const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: "◫" },
  { label: "Bookings", href: "/bookings", icon: "☰" },
  { label: "Customers", href: "/customers", icon: "◎" },
  { label: "Payments", href: "/payments", icon: "◌" },
];

export default function Sidebar() {
  const pathname = usePathname();
  // Comentario: usePathname es apropiado para detectar la ruta activa, pero para rutas anidadas convendría usar `startsWith`.

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <h2 className="admin-sidebar__title">BookFlow</h2>
        <p className="admin-sidebar__subtitle">Admin workspace</p>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Main navigation">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""}`}
            >
              {/* Mejora: usar iconos SVG o componentes de íconos en lugar de caracteres Unicode para mayor consistencia visual. */}
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {/* Nota: sería conveniente añadir un estado de carga o placeholder si la navegación depende de datos asíncronos. */}
    </aside>
  );
}