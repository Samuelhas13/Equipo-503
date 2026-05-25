"use client";

import { ReactNode } from "react";

// INTERFAZ: FooterProps para máxima flexibilidad, robustez y type-safety
interface FooterProps {
  // Permite un texto de copyright personalizado (o año dinámico)
  copyright?: string;
  // Soporte para enlaces dinámicos (políticas de privacidad, términos, etc.)
  links?: ReactNode;
  // Soporte para contenido extra en el lado opuesto (ej. versión de la app, estado de la API)
  meta?: ReactNode;
}

// Props con valores por defecto orientados al ecosistema de "Bookings Admin"
export default function Footer({
  copyright = `© ${new Date().getFullYear()} Bookings Admin. Todos los derechos reservados.`,
  links,
  meta,
}: FooterProps) {
  return (
    <footer 
      className="admin-footer" 
      role="contentinfo"
      // ACCESIBILIDAD: role="contentinfo" indica a los lectores de pantalla que este es el pie de página principal
    >
      <div className="admin-footer__content">
        {/* Sección de Copyright e información básica */}
        <p className="admin-footer__copyright">{copyright}</p>

        {/* Sección de enlaces de navegación secundaria si se proveen */}
        {links && (
          <nav className="admin-footer__links" role="navigation" aria-label="Enlaces del pie de página">
            {links}
          </nav>
        )}
      </div>

      {/* Sección Meta opcional: Ideal para poner la versión del panel o un badge de estado */}
      {meta && (
        <div className="admin-footer__meta">
          {meta}
        </div>
      )}
    </footer>
  );
}