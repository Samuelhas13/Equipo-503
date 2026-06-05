"use client";

import { createContext, ReactNode, useContext, useState } from "react";

// Tipo de idioma permitido en la aplicación
type Language = "es" | "en";

// Tipo de datos que compartirá el contexto
interface LanguageContextType {
  language: Language;
  changeLanguage: () => void;
}

// Creamos el contexto de idioma.
// Al principio está vacío, por eso usamos undefined.
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider que envolverá la aplicación y guardará el idioma actual
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Estado global del idioma.
  // Empieza en español.
  const [language, setLanguage] = useState<Language>("es");

  // Cambia de español a inglés y de inglés a español
  function changeLanguage() {
    if (language === "es") {
      setLanguage("en");
    } else {
      setLanguage("es");
    }
  }

  return (
    // Compartimos el idioma actual y la función changeLanguage con los componentes hijos.
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook personalizado para usar el idioma desde cualquier componente
export function useLanguage() {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error("useLanguage debe usarse dentro de LanguageProvider");
  }

  return context;
}