"use client";

import { useEffect, useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import {
  getBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  createAppointment,
} from "@/lib/api";
import type { Business } from "@/lib/types";

// Tipo enriquecido para la interfaz de usuario
interface EnrichedBusiness extends Business {
  category: string;
  icon: string;
  desc: string;
  services: string[];
}

// Función de enriquecimiento para asignar íconos, categorías y servicios predeterminados o basados en el nombre
function enrichBusiness(b: Business): EnrichedBusiness {
  const nombre = b.nombre || "";
  const direccion = b.direccion || "";

  if (/peluquer[ií]a|nova/i.test(nombre)) {
    return {
      ...b,
      category: "Belleza & Estética",
      icon: "💇",
      desc: "Cortes, peinados y tratamientos capilares de vanguardia. Reserva tu cita con nuestros estilistas profesionales.",
      services: ["Corte + Peinado", "Tinte Completo", "Tratamiento de Keratina", "Peinado de Fiesta"],
    };
  } else if (/restaurante|marea/i.test(nombre)) {
    return {
      ...b,
      category: "Gastronomía",
      icon: "🍲",
      desc: "Comida de mar y platos mediterráneos exquisitos. Reserva una mesa para disfrutar de una velada gastronómica inigualable.",
      services: ["Almuerzo / Cena Estándar", "Menú Degustación", "Brunch Especial"],
    };
  } else if (/barber/i.test(nombre)) {
    return {
      ...b,
      category: "Barbería",
      icon: "💈",
      desc: "Cortes clásicos, arreglos de barba y afeitados premium para caballeros con estilo.",
      services: ["Corte de Caballero", "Arreglo de Barba", "Afeitado Tradicional", "Corte + Barba"],
    };
  } else if (/gimnasio|fit/i.test(nombre)) {
    return {
      ...b,
      category: "Salud & Bienestar",
      icon: "🏋️",
      desc: "Entrenamientos personalizados, clases grupales y equipamiento de última generación.",
      services: ["Entrenamiento Personalizado", "Acceso a Sala Libre", "Clase Dirigida (Yoga/Pilates)"],
    };
  } else if (/dental|cl[ií]nica/i.test(nombre)) {
    return {
      ...b,
      category: "Salud",
      icon: "🦷",
      desc: "Odontología general, ortodoncia, implantes y estética dental para toda la familia.",
      services: ["Limpieza Dental", "Revisión + Diagnóstico", "Blanqueamiento Dental"],
    };
  } else {
    // Generar datos temáticos según el ID
    const categories = ["Servicios", "Comercio", "Estilo", "Salud"];
    const icons = ["🏢", "💼", "✨", "🏥"];
    const index = b.id % categories.length;
    return {
      ...b,
      category: categories[index],
      icon: icons[index],
      desc: `Servicios profesionales de alta calidad en nuestra sede ubicada en ${direccion || "la dirección registrada"}.`,
      services: ["Consulta General", "Asesoría Básica", "Servicio Estándar"],
    };
  }
}

export default function EmpresasPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  // Estados principales
  const [rawBusinesses, setRawBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de Modales / Formularios
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedBusiness, setSelectedBusiness] = useState<EnrichedBusiness | null>(null);
  const [formData, setFormData] = useState({ nombre: "", direccion: "" });
  const [actionLoading, setActionLoading] = useState(false);

  // Modal de Reservas (usuario)
  const [bookingBusiness, setBookingBusiness] = useState<EnrichedBusiness | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("10:00");
  const [bookingService, setBookingService] = useState("");
  const [bookingPersons, setBookingPersons] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Textos para multilenguaje
  const texts = {
    es: {
      title: "Comercios Disponibles",
      subtitle: "Explora negocios locales y reserva tu cita instantáneamente en la plataforma.",
      adminTitle: "Gestión de Empresas",
      adminSubtitle: "Administra las empresas asociadas al sistema, edita sus datos o elimina registros.",
      empresaTitle: "Mi Empresa",
      empresaSubtitle: "Visualiza y actualiza la información de tu comercio.",
      newBusiness: "Añadir Empresa",
      closeForm: "Cerrar formulario",
      formTitleNew: "Nueva Empresa",
      formTitleEdit: "Editar Empresa",
      name: "Nombre de la Empresa",
      address: "Dirección",
      save: "Guardar",
      saving: "Guardando...",
      deleteConfirm: "¿Estás seguro de que quieres eliminar esta empresa?",
      edit: "Editar",
      delete: "Eliminar",
      reserve: "Reservar Cita",
      loading: "Cargando empresas...",
      errorLoad: "Error al cargar las empresas. Por favor, inténtelo de nuevo más tarde.",
      errorAction: "No se pudo completar la acción. Por favor, intente de nuevo.",
      searchPlaceholder: "Buscar empresa...",
      filter: "Filtrar",
      cancel: "Cancelar",
      createSuccess: "Empresa creada con éxito.",
      updateSuccess: "Empresa actualizada con éxito.",
      deleteSuccess: "Empresa eliminada con éxito.",
      dateLabel: "Fecha",
      timeLabel: "Hora",
      serviceLabel: "Servicio",
      personsLabel: "Personas (1-5)",
      bookingConfirm: "Confirmar Reserva",
      bookingCreating: "Creando...",
      bookingSuccessMsg: "🎉 ¡Reserva creada con éxito! Redirigiendo a tus reservas...",
    },
    en: {
      title: "Available Businesses",
      subtitle: "Explore local businesses and book your appointment instantly.",
      adminTitle: "Business Management",
      adminSubtitle: "Manage the businesses associated with the system, edit their details, or delete records.",
      empresaTitle: "My Business",
      empresaSubtitle: "View and update your business details.",
      newBusiness: "Add Business",
      closeForm: "Close form",
      formTitleNew: "New Business",
      formTitleEdit: "Edit Business",
      name: "Business Name",
      address: "Address",
      save: "Save",
      saving: "Saving...",
      deleteConfirm: "Are you sure you want to delete this business?",
      edit: "Edit",
      delete: "Delete",
      reserve: "Book Appointment",
      loading: "Loading businesses...",
      errorLoad: "Failed to load businesses. Please try again later.",
      errorAction: "Could not complete the action. Please try again.",
      searchPlaceholder: "Search business...",
      filter: "Filter",
      cancel: "Cancel",
      createSuccess: "Business created successfully.",
      updateSuccess: "Business updated successfully.",
      deleteSuccess: "Business deleted successfully.",
      dateLabel: "Date",
      timeLabel: "Time",
      serviceLabel: "Service",
      personsLabel: "Persons (1-5)",
      bookingConfirm: "Confirm Booking",
      bookingCreating: "Creating...",
      bookingSuccessMsg: "🎉 Booking created successfully! Redirecting to your bookings...",
    },
  };

  const t = texts[language === "en" ? "en" : "es"];

  // Cargar las empresas del backend
  const loadBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBusinesses();
      setRawBusinesses(data);
    } catch (err: any) {
      console.error("Error fetching businesses:", err);
      setError(err?.message || t.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  // Enriquecer la lista de empresas obtenida del backend
  const enrichedBusinesses = rawBusinesses.map(enrichBusiness);

  // Filtrar según el buscador
  const normalizedSearch = search.toLowerCase();
  const filteredBusinesses = enrichedBusinesses.filter(
    (b) =>
      b.nombre.toLowerCase().includes(normalizedSearch) ||
      (b.direccion || "").toLowerCase().includes(normalizedSearch)
  );

  const ITEMS_PER_PAGE = 9;

  const totalPages = Math.ceil(filteredBusinesses.length / ITEMS_PER_PAGE);

  const paginatedBusinesses = filteredBusinesses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Funciones de ayuda para obtener la fecha de hoy en formato string YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Manejo de Modales
  const handleOpenCreate = () => {
    setFormMode("create");
    setSelectedBusiness(null);
    setFormData({ nombre: "", direccion: "" });
    setIsFormOpen(true);
    setError(null);
  };

  const handleOpenEdit = (business: EnrichedBusiness) => {
    setFormMode("edit");
    setSelectedBusiness(business);
    setFormData({ nombre: business.nombre, direccion: business.direccion || "" });
    setIsFormOpen(true);
    setError(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedBusiness(null);
  };

  // Guardar (Crear o Editar)
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      if (formMode === "create") {
        const newBiz = await createBusiness(formData);
        setRawBusinesses((prev) => [...prev, newBiz]);
      } else if (formMode === "edit" && selectedBusiness) {
        const updatedBiz = await updateBusiness(selectedBusiness.id, formData);
        setRawBusinesses((prev) =>
          prev.map((b) => (b.id === selectedBusiness.id ? updatedBiz : b))
        );
      }
      handleCloseForm();
    } catch (err: any) {
      console.error("Error saving business:", err);
      setError(err?.message || t.errorAction);
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminar Empresa
  const handleDelete = async (id: number) => {
    if (!window.confirm(t.deleteConfirm)) return;
    setError(null);

    try {
      await deleteBusiness(id);
      setRawBusinesses((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      console.error("Error deleting business:", err);
      setError(err?.message || t.errorAction);
    }
  };

  // Abrir Modal de Reserva
  const handleOpenBooking = (business: EnrichedBusiness) => {
    setBookingBusiness(business);
    setBookingService(business.services[0] || "");
    setBookingDate(getTodayString());
    setBookingTime("10:00");
    setBookingPersons(1);
    setBookingSuccess(false);
    setError(null);
  };

  const handleCloseBooking = () => {
    setBookingBusiness(null);
  };

  // Confirmar Reserva
  const handleBookingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!bookingBusiness || !user) return;

    setActionLoading(true);
    setError(null);

    const finalServiceName = `${bookingService} (${bookingPersons} ${
      bookingPersons === 1 ? (language === "en" ? "person" : "persona") : (language === "en" ? "people" : "personas")
    })`;

    try {
      await createAppointment({
        date: bookingDate,
        time: bookingTime,
        status: "pending",
        customerId: user.customerId || 1, // Fallback en caso de que no tenga customerId asignado
        businessId: bookingBusiness.id,
        serviceName: finalServiceName,
      });

      setBookingSuccess(true);
      setTimeout(() => {
        handleCloseBooking();
        router.push("/bookings");
      }, 2000);
    } catch (err: any) {
      console.error("Error creating booking:", err);
      setError(err?.message || (language === "en" ? "Failed to create reservation." : "No se pudo crear la reserva."));
    } finally {
      setActionLoading(false);
    }
  };

  // Cabeceras según el rol
  const getHeaderTitle = () => {
    if (user?.role === "admin") return t.adminTitle;
    if (user?.role === "empresa") return t.empresaTitle;
    return t.title;
  };

  const getHeaderSubtitle = () => {
    if (user?.role === "admin") return t.adminSubtitle;
    if (user?.role === "empresa") return t.empresaSubtitle;
    return t.subtitle;
  };

  return (
    <div className="page-stack">
      {/* Cabecera / Hero */}
      <section className="page-hero">
        <div>
          <h2>{getHeaderTitle()}</h2>
          <p>{getHeaderSubtitle()}</p>
        </div>

        {user?.role === "admin" && (
          <button className="primary-btn" type="button" onClick={handleOpenCreate}>
            {t.newBusiness}
          </button>
        )}
      </section>

      {/* Alerta de Error General */}
      {error && (
        <div className="message-error" style={{ margin: "10px 0" }}>
          {error}
        </div>
      )}

      {/* Buscador (solo si no es rol 'empresa', ya que la empresa solo ve la suya) */}
      {user?.role !== "empresa" && !loading && (
        <section className="section-card">
          <div className="search-row">
            <input
              className="input"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            />
            <button className="secondary-btn" type="button">
              {t.filter}
            </button>
          </div>
        </section>
      )}

      {/* Cuerpo principal (Carga / Grid de Tarjetas) */}
      {loading ? (
        <div className="animate-pulse space-y-4" style={{ padding: "20px 0" }}>
          <div style={{ height: "40px", background: "var(--border-color)", borderRadius: "8px" }}></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{ height: "220px", background: "var(--border-color)", borderRadius: "12px" }}></div>
            ))}
          </div>
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <div className="section-card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>
            {language === "en" ? "No businesses found." : "No se encontraron comercios registrados."}
          </p>
        </div>
      ) : (
        <>
         <section className="business-grid"> 
    {paginatedBusinesses.map((business) => (
      <div key={business.id} className="business-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="business-icon-wrapper">{business.icon}</div>
          <span className="business-category">{business.category}</span>
        </div>

        <div className="business-info">
          <h3 className="business-title">{business.nombre}</h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>📍</span> {business.direccion}
          </p>
          <p className="business-desc">{business.desc}</p>
        </div>

        {/* Acciones según el rol */}
        <div className="business-actions" style={{ marginTop: "auto", display: "flex", gap: "10px" }}>
          {user?.role === "usuario" && (
            <button
              type="button"
              className="primary-btn"
              style={{ width: "100%" }}
              onClick={() => handleOpenBooking(business)}
            >
              {t.reserve}
            </button>
          )}

          {(user?.role === "admin" || (user?.role === "empresa" && user.businessId === business.id)) && (
            <button
              type="button"
              className="secondary-btn"
              style={{ flex: 1 }}
              onClick={() => handleOpenEdit(business)}
            >
              {t.edit}
            </button>
          )}

          {user?.role === "admin" && (
            <button
              type="button"
              className="secondary-btn"
              style={{ flex: 1, color: "var(--error-color, #ef4444)", borderColor: "var(--error-color, #ef4444)" }}
              onClick={() => handleDelete(business.id)}
            >
              {t.delete}
            </button>
          )}
        </div>
      </div>
    ))}
  </section>

  {totalPages > 1 && (
    <div
      className="section-card"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <button
        type="button"
        className="secondary-btn"
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
      >
        Anterior
      </button>

      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>
        Página {currentPage} de {totalPages}
      </span>

      <button
        type="button"
        className="secondary-btn"
        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
      >
        Siguiente
      </button>
    </div>
  )}
</>
)}

      {/* MODAL: Añadir/Editar Empresa (Admin / Empresa) */}
      {isFormOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseForm();
          }}
        >
          <div className="modal-card" style={{ width: "min(100%, 520px)" }}>
            <h3 className="modal-title" style={{ fontSize: "24px", marginBottom: "18px" }}>
              {formMode === "create" ? t.formTitleNew : t.formTitleEdit}
            </h3>

            <form onSubmit={handleFormSubmit} className="page-stack" style={{ gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t.name}
                </label>
                <input
                  className="input"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Ej. Peluquería Nova"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t.address}
                </label>
                <input
                  className="input"
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  required
                  placeholder="Ej. Calle Gran Vía, 45"
                />
              </div>

              <div className="modal-actions" style={{ marginTop: "12px" }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleCloseForm}
                  disabled={actionLoading}
                >
                  {t.cancel}
                </button>
                <button type="submit" className="primary-btn" disabled={actionLoading}>
                  {actionLoading ? t.saving : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Reserva (Solo Usuario) */}
      {bookingBusiness && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseBooking();
          }}
        >
          <div className="modal-card" style={{ width: "min(100%, 520px)" }}>
            <h3 className="modal-title" style={{ fontSize: "22px", marginBottom: "18px" }}>
              {language === "en"
                ? `New booking at ${bookingBusiness.nombre}`
                : `Nueva reserva en ${bookingBusiness.nombre}`}
            </h3>

            {bookingSuccess ? (
              <div
                className="message-success"
                style={{ textAlign: "center", margin: "20px 0", fontSize: "16px" }}
              >
                {t.bookingSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="page-stack" style={{ gap: 16 }}>
                <div className="form-grid">
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                      {t.dateLabel}
                    </label>
                    <input
                      className="input"
                      type="date"
                      min={getTodayString()}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                      {t.timeLabel}
                    </label>
                    <input
                      className="input"
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input--full" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                      {t.serviceLabel}
                    </label>
                    <select
                      className="select"
                      value={bookingService}
                      onChange={(e) => setBookingService(e.target.value)}
                      required
                      style={{ padding: "13px 16px" }}
                    >
                      {bookingBusiness.services.map((srv) => (
                        <option key={srv} value={srv}>
                          {srv}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input--full" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                      {t.personsLabel}
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setBookingPersons((prev) => Math.max(1, prev - 1))}
                        style={{ padding: "8px 16px", fontSize: "16px", fontWeight: "bold" }}
                      >
                        -
                      </button>
                      <input
                        className="input"
                        type="number"
                        min={1}
                        max={5}
                        value={bookingPersons}
                        style={{ width: "60px", textAlign: "center", fontWeight: "bold" }}
                        required
                        readOnly
                      />
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setBookingPersons((prev) => Math.min(5, prev + 1))}
                        style={{ padding: "8px 16px", fontSize: "16px", fontWeight: "bold" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: "12px" }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={handleCloseBooking}
                    disabled={actionLoading}
                  >
                    {t.cancel}
                  </button>
                  <button type="submit" className="primary-btn" disabled={actionLoading}>
                    {actionLoading ? t.bookingCreating : t.bookingConfirm}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
