"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: "◫" },
  { label: "Bookings", href: "/bookings", icon: "☰" },
  { label: "Customers", href: "/customers", icon: "◎" },
  { label: "Payments", href: "/payments", icon: "◌" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <h2 className="admin-sidebar__title">BookFlow</h2>
        <p className="admin-sidebar__subtitle">Admin workspace</p>
      </div>

      <nav className="admin-sidebar__nav">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}