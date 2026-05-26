"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type MenuItem = {
  label: string;
  href: string;
  icon: string;
};

const defaultMenuItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "◫" },
  { label: "Bookings", href: "/bookings", icon: "☰" },
  { label: "Customers", href: "/customers", icon: "◎" },
  { label: "Payments", href: "/payments", icon: "◌" },
  { label: "Contacto", href: "/contacto", icon: "✉" },
];

interface SidebarProps {
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
  
  // Estado para controlar el tema (claro por defecto)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sincronizar el estado con localStorage y la clase en el HTML al montar el componente
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Función para alternar el tema
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  return (
    <aside className="admin-sidebar" role="navigation">
      {/* Contenedor Superior: Brand y Navegación */}
      <div className="admin-sidebar__top">
        <div className="admin-sidebar__brand">
          <h2 className="admin-sidebar__title">{brandTitle}</h2>
          <p className="admin-sidebar__subtitle">{brandSubtitle}</p>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Main navigation">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            
            const handleClick = () => {
              onNavigate?.(item.href);
            };

            const linkClasses = `admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""} admin-sidebar__link--hoverable`;

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

      {/* Contenedor Inferior: Botón de cambio de tema funcional */}
      <div className="admin-sidebar__bottom">
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          aria-label={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          <span className="theme-toggle-btn__icon" aria-hidden="true">
            {isDarkMode ? "☀️" : "🌙"}
          </span>
          <span className="theme-toggle-btn__label">
            {isDarkMode ? "Modo Claro" : "Modo Oscuro"}
          </span>
        </button>
      </div>
    </aside>
  );
}