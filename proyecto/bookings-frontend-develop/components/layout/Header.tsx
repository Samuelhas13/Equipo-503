// Componente Header: Renderiza el encabezado principal de la aplicación de administración.
// Funcionalidad: Muestra un título estático "Bookings Admin" y una descripción de la plataforma.
// Propósito: Proporciona una identidad visual y contextual en la parte superior de la interfaz.
// Posibles mejoras:
// - Aceptar props para título y subtítulo dinámicos (ej. props.title, props.subtitle).
// - Integrar un menú de usuario o acciones rápidas (ej. notificaciones, perfil).
// - Hacerlo responsive con estilos adaptativos para móviles.
// - Añadir accesibilidad con roles ARIA (ej. role="banner").

export default function Header() {
    return (
      <header
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "20px 24px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "28px" }}>Bookings Admin</h1>
        <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}>
          Plataforma de gestión de reservas y cobros
        </p>
      </header>
    );
  }