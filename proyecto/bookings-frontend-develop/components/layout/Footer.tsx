"use client";

import { memo } from "react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  companyName?: string;
  links?: FooterLink[];
  environment?: "production" | "staging" | "development";
}

const defaultLinks: FooterLink[] = [
  { label: "Soporte Técnico", href: "/soporte" },
  { label: "Documentación API", href: "/docs" },
  { label: "Changelog (v2.4.1)", href: "/updates" },
  { label: "Términos y Privacidad", href: "/legal" }
];

const Footer = memo(function Footer({
  companyName = "Bookings Admin",
  links = defaultLinks,
  environment = "production"
}: FooterProps) {

  const copyDiagnostics = () => {
    const info = `App: ${companyName} | Env: ${environment} | Ver: 2.4.1 | Date: ${new Date().toISOString()}`;
    navigator.clipboard.writeText(info);
    alert("¡Datos de diagnóstico copiados al portapapeles! 🚀");
  };

  return (
    <footer className="admin-footer" role="contentinfo">
      <div className="admin-footer__wrapper">
        
        {/* BLOQUE IZQUIERDO: Marca, Copyright y Entorno */}
        <div className="admin-footer__section admin-footer__section--left">
          <div className="admin-footer__brand">
            <span className="admin-footer__logo-icon">📅</span>
            <span className="admin-footer__company">{companyName}</span>
          </div>
          <p className="admin-footer__copyright">
            &copy; {new Date().getFullYear()} Todos los derechos reservados.
          </p>
          <span className={`admin-footer__badge admin-footer__badge--${environment}`}>
            {environment}
          </span>
        </div>

        {/* BLOQUE CENTRAL: Enlaces Navegación Distribuidos */}
        <nav className="admin-footer__section admin-footer__section--center" aria-label="Enlaces del pie de página">
          <ul className="admin-footer__links-list">
            {links.map((link, index) => (
              <li key={index}>
                <a href={link.href} className="admin-footer__link">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* BLOQUE DERECHO: Estado del Sistema y Utilidades */}
        <div className="admin-footer__section admin-footer__section--right">
          <div className="admin-footer__status-card">
            <span className="admin-footer__pulse-dot"></span>
            <span className="admin-footer__status-text">API Systems Operational</span>
          </div>
          
          <button 
            onClick={copyDiagnostics} 
            className="admin-footer__action-btn"
            title="Copiar metadatos para el equipo de soporte"
          >
            <span>🛠️</span> Copiar Diagnóstico
          </button>
        </div>

      </div>
    </footer>
  );
});

export default Footer;