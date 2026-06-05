"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

type MenuItem = {
  label: string;
  href: string;
  icon: string;
};

interface SidebarProps {
  menuItems?: MenuItem[];
  onNavigate?: (href: string) => void;
  brandTitle?: string;
  brandSubtitle?: string;
}

export default function Sidebar({
  menuItems,
  onNavigate,
  brandTitle = "BookFlow",
  brandSubtitle,
}: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Obtenemos el idioma global para traducir los textos del sidebar
  const { language } = useLanguage();


  // Estado para controlar si el sidebar está expandido o colapsado
  const [isOpen, setIsOpen] = useState(true);

  // Textos del sidebar en español e inglés
  const sidebarTexts = {
    es: {
      dashboard: "Panel",
      bookings: "Reservas",
      customers: "Clientes",
      payments: "Pagos",
      contacto: "Contacto",
      myBookings: "Mis Reservas",
      empresas: "Empresas",
      clientePortal: "Portal de Cliente",
      comercioPortal: "Portal de Comercio",
      adminWorkspace: "Espacio de administración",
      collapseMenu: "Contraer menú",
      expandMenu: "Expandir menú",

    },
    en: {
      dashboard: "Dashboard",
      bookings: "Bookings",
      customers: "Customers",
      payments: "Payments",
      contacto: "Contact",
      myBookings: "My Bookings",
      empresas: "Companies",
      clientePortal: "Customer Portal",
      comercioPortal: "Business Portal",
      adminWorkspace: "Admin workspace",
      collapseMenu: "Collapse menu",
      expandMenu: "Expand menu",

    },
  };

  // Menús traducidos según el idioma seleccionado
  const adminMenuItems: MenuItem[] = [
    { label: sidebarTexts[language].dashboard, href: "/dashboard", icon: "◫" },
    { label: sidebarTexts[language].bookings, href: "/bookings", icon: "☰" },
    { label: sidebarTexts[language].empresas, href: "/empresas", icon: "⌂" },
    { label: sidebarTexts[language].customers, href: "/customers", icon: "◎" },
    { label: sidebarTexts[language].payments, href: "/payments", icon: "◌" },
    { label: sidebarTexts[language].contacto, href: "/contacto", icon: "✉" },
  ];

  const empresaMenuItems: MenuItem[] = [
    { label: sidebarTexts[language].dashboard, href: "/dashboard", icon: "◫" },
    { label: sidebarTexts[language].bookings, href: "/bookings", icon: "☰" },
    { label: sidebarTexts[language].empresas, href: "/empresas", icon: "⌂" },
    { label: sidebarTexts[language].customers, href: "/customers", icon: "◎" },
    { label: sidebarTexts[language].payments, href: "/payments", icon: "◌" },
    { label: sidebarTexts[language].contacto, href: "/contacto", icon: "✉" },
  ];

  const usuarioMenuItems: MenuItem[] = [
    { label: sidebarTexts[language].myBookings, href: "/bookings", icon: "☰" },
    { label: sidebarTexts[language].empresas, href: "/empresas", icon: "⌂" },
    { label: sidebarTexts[language].contacto, href: "/contacto", icon: "✉" },
  ];



  // Determina qué menú se muestra según el rol del usuario
  let activeMenuItems = menuItems;

  if (!activeMenuItems) {
    if (user?.role === "usuario") {
      activeMenuItems = usuarioMenuItems;
    } else if (user?.role === "empresa") {
      activeMenuItems = empresaMenuItems;
    } else {
      activeMenuItems = adminMenuItems;
    }
  }

  // Determina el subtítulo del sidebar según el rol y el idioma seleccionado
  let activeBrandSubtitle = brandSubtitle;

  if (!activeBrandSubtitle) {
    if (user?.role === "usuario") {
      activeBrandSubtitle = sidebarTexts[language].clientePortal;
    } else if (user?.role === "empresa") {
      activeBrandSubtitle = sidebarTexts[language].comercioPortal;
    } else {
      activeBrandSubtitle = sidebarTexts[language].adminWorkspace;
    }
  }

  // Función para alternar la visibilidad del sidebar
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <aside
      className={`admin-sidebar ${!isOpen ? "admin-sidebar--collapsed" : ""}`}
      role="navigation"
    >
      <div className="admin-sidebar__top">
        <div className="admin-sidebar__brand-container">
          <div className="admin-sidebar__brand">
            <h2 className="admin-sidebar__title">{brandTitle}</h2>
            <p className="admin-sidebar__subtitle">{activeBrandSubtitle}</p>
          </div>

          <button
            onClick={toggleSidebar}
            className="admin-sidebar__toggle-btn admin-sidebar-boton--collapsed color-boton"
            aria-label={
              isOpen
                ? sidebarTexts[language].collapseMenu
                : sidebarTexts[language].expandMenu
            }
          >
            {isOpen ? "◀" : "▶"}
          </button>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Main navigation">
          {activeMenuItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            const handleClick = () => {
              onNavigate?.(item.href);
            };

            const linkClasses = `admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""
              } admin-sidebar__link--hoverable`;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleClick}
                className={linkClasses}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="admin-sidebar__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="admin-sidebar__label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

    </aside>
  );
}