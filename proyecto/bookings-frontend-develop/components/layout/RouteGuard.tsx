"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const isLoginPage = pathname === "/login";

    if (!user) {
      // Not logged in: redirect to login
      if (!isLoginPage) {
        router.push("/login");
      }
    } else {
      // Logged in:
      if (isLoginPage) {
        // Redirect to their default landing page
        if (user.role === "usuario") {
          router.push("/bookings");
        } else {
          router.push("/dashboard");
        }
        return;
      }

      // Check role permissions:
      if (user.role === "usuario") {
        const allowedUserPaths = ["/bookings", "/empresas", "/contacto", "/mi-perfil"];
        const isAllowed = allowedUserPaths.some(
          (path) => (pathname === path || pathname.startsWith(path + "/")) && !pathname.startsWith("/contacto/mensajes")
        );

        if (!isAllowed) {
          router.push("/bookings");
        }
      } else if (user.role === "empresa") {
        const allowedEmpresaPaths = ["/dashboard", "/bookings", "/contacto", "/empresas", "/customers", "/mi-perfil"];
        const isAllowed = allowedEmpresaPaths.some(
          (path) => (pathname === path || pathname.startsWith(path + "/")) && !pathname.startsWith("/contacto/mensajes")
        );

        if (!isAllowed) {
          router.push("/dashboard");
        }
      }
    }
  }, [user, loading, pathname, router]);

  // Show nothing or a nice loading spinner while state is resolved
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Cargando Turniagenidx...</p>
      </div>
    );
  }

  // To prevent visual flickering of protected pages before redirect happens
  const isLoginPage = pathname === "/login";
  if (!user && !isLoginPage) {
    return null;
  }
  if (user && isLoginPage) {
    return null;
  }

  // Enforce role routing check (prevent rendering unauthorized pages for a split second)
  if (user && user.role === "usuario") {
    const allowedUserPaths = ["/bookings", "/empresas", "/contacto", "/mi-perfil"];
    const isAllowed = allowedUserPaths.some(
      (path) => (pathname === path || pathname.startsWith(path + "/")) && !pathname.startsWith("/contacto/mensajes")
    );
    if (!isAllowed) return null;
  } else if (user && user.role === "empresa") {
    const allowedEmpresaPaths = ["/dashboard", "/bookings", "/contacto", "/empresas", "/customers", "/mi-perfil"];
    const isAllowed = allowedEmpresaPaths.some(
      (path) => (pathname === path || pathname.startsWith(path + "/")) && !pathname.startsWith("/contacto/mensajes")
    );
    if (!isAllowed) return null;
  }

  return <>{children}</>;
}
