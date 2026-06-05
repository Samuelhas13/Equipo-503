"use client";

import { useState } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Sidebar from "../../components/layout/Sidebar";
import { LanguageProvider } from "@/context/LanguageContext";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Estado para controlar si el menú móvil está abierto
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Función para alternar el menú
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
     <LanguageProvider>
    <div className={`admin-layout ${isSidebarOpen ? "sidebar-open" : ""}`}>
      
      {/* 1. Pasamos el botón al Header mediante la prop 'actions' */}
      <Header 
        actions={
          <>
            <button 
              className="admin-header__toggle-btn"
              onClick={toggleSidebar}
              aria-label="Toggle menú"
            >
              {isSidebarOpen ? "✕" : "☰"}
            </button>
          </>
        } 
      />

      <div className="admin-layout__wrapper">
        {/* 2. El Sidebar ahora responde a la clase que pondremos en el CSS */}
        <Sidebar />
        
        {/* 3. Un fondo oscuro (overlay) que aparece en móvil para cerrar el menú al hacer clic fuera */}
        {isSidebarOpen && (
          <div className="admin-layout__overlay" onClick={toggleSidebar} />
        )}

        <div className="admin-layout__body">
          <main className="admin-layout__main">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
    </LanguageProvider>
  );
}