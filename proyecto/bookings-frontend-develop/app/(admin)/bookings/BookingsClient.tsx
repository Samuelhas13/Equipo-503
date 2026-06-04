"use client";



import { useMemo, useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import type {
  Booking,
  BookingStatus,
  CreateBookingDto,
  UpdateBookingDto,
} from "@/lib/types";
import {
  createAppointment,
  deleteAppointment,
  getCustomerById,
  getCustomers,
  getBusinesses,
  updateAppointment,
} from "@/lib/api";

const BUSINESS_NAMES: Record<number, string> = {
  1: "Peluquería Nova",
  2: "Restaurante Marea",
  3: "Barber Studio",
  4: "Gimnasio Fit",
  5: "Clínica Dental",
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    paid: "Pagada",
    canceled: "Cancelada",
    completed: "Completada",
  };
  return <span className={`badge badge--${status}`}>{map[status] ?? status}</span>;
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentTimeString() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

interface KpiCardColor {
  bar: string;
  trendBg: string;
  trendText: string;
}

interface KpiCardProps {
  title: string;
  value: string | number;
  trend: string;
  color: KpiCardColor;
  activity: number[];
}

function KpiCard({ title, value, trend, color, activity }: KpiCardProps) {
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barsRef.current) return;

    const container = barsRef.current;
    const max = Math.max(...activity);

    const bars = container.querySelectorAll<HTMLDivElement>(".kpi-d__dot");
    setTimeout(() => {
      bars.forEach((bar, i) => {
        const v = activity[i] ?? 0;
        const heightPx = Math.round((v / max) * 24 + 4);
        const opacity = v === max ? 1 : v > max * 0.7 ? 0.65 : 0.3;
        bar.style.height = `${heightPx}px`;
        bar.style.opacity = String(opacity);
      });
    }, 150);
  }, [activity]);

  return (
    <div className="kpi-card kpi-card--variant-d">
      <div
        className="kpi-card__accent"
        style={{ background: color.bar }}
        aria-hidden="true"
      />

      <div className="kpi-card__head" style={{ justifyContent: "flex-end" }}>
        <span
          className="kpi-card__trend-badge"
          style={{ background: color.trendBg, color: color.trendText }}
        >
          {trend}
        </span>
      </div>

      <p className="kpi-card__label">{title}</p>
      <p className="kpi-card__value">{value}</p>

      <div className="kpi-card__dots" ref={barsRef} aria-hidden="true">
        {activity.map((_, i) => (
          <div
            key={i}
            className="kpi-d__dot"
            style={{
              background: color.bar,
              opacity: 0.25,
              height: "4px",
              flex: 1,
              borderRadius: "2px 2px 0 0",
              transition: "height 0.8s cubic-bezier(0.4,0,0.2,1), opacity 0.8s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const KPI_COLORS: Record<string, KpiCardColor> = {
  teal: {
    bar: "#1D9E75",
    trendBg: "#E1F5EE",
    trendText: "#085041",
  },
  amber: {
    bar: "#EF9F27",
    trendBg: "#FAEEDA",
    trendText: "#412402",
  },
  green: {
    bar: "#22C55E",
    trendBg: "#DCFCE7",
    trendText: "#14532D",
  },
  purple: {
    bar: "#7F77DD",
    trendBg: "#EEEDFE",
    trendText: "#26215C",
  },
};

const ACTIVITY_DATA = {
  total: [50, 65, 55, 75, 60, 85, 70, 90, 75, 95, 80, 100, 90, 110],
  pending: [60, 40, 70, 30, 50, 20, 40, 35, 55, 25, 45, 30, 50, 20],
  confirmed: [40, 55, 35, 70, 60, 80, 75, 90, 65, 85, 70, 95, 80, 100],
  paid: [30, 45, 20, 55, 40, 65, 50, 70, 45, 60, 55, 80, 65, 90],
};

export default function BookingsClient({
  initialBookings,
}: {
  initialBookings: Booking[];
}) {
  const { user } = useAuth();
  const { language } = useLanguage();

  const texts = {
    es: {
      title: "Panel de Reservas",
      subtitle: "Gestiona las citas, clientes y estados de tu negocio.",
      newBooking: "Nueva reserva",
      totalBookings: "Total reservas",
      availableRecords: "registros disponibles",
      pending: "Pendientes",
      needsFollowUp: "requiere seguimiento",
      confirmed: "Confirmadas",
      activeStatus: "citas activas",
      paid: "Pagadas",
      closedBookings: "transacciones completadas",
      date: "Fecha",
      time: "Hora",
      status: "Estado",
      customerId: "ID Cliente",
      businessId: "ID Negocio",
      business: "Comercio",
      people: "Personas (1-5)",
      service: "Servicio",
      customerFound: "Cliente encontrado",
      name: "Nombre",
      phone: "Teléfono",
      editBookingTitle: "Editar reserva",
      cancel: "Cancelar",
      pendingOption: "Pendiente",
      confirmedOption: "Confirmada",
      paidOption: "Pagada",
      edit: "Editar",
    },
    en: {
      title: "Bookings Dashboard",
      subtitle: "Manage your business appointments, customers, and statuses.",
      newBooking: "New Booking",
      totalBookings: "Total Bookings",
      availableRecords: "available records",
      pending: "Pending",
      needsFollowUp: "needs follow-up",
      confirmed: "Confirmed",
      activeStatus: "active appointments",
      paid: "Paid",
      closedBookings: "completed transactions",
      date: "Date",
      time: "Time",
      status: "Status",
      customerId: "Customer ID",
      businessId: "Business ID",
      business: "Business",
      people: "People (1-5)",
      service: "Service",
      customerFound: "Customer found",
      name: "Name",
      phone: "Phone",
      editBookingTitle: "Edit Booking",
      cancel: "Cancel",
      pendingOption: "Pending",
      confirmedOption: "Confirmed",
      paidOption: "Paid",
      edit: "Edit",
    },
  };

  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const emptyForm: CreateBookingDto = {
    date: "",
    time: "",
    status: "pending",
    customerId: 1,
    businessId: 1,
    serviceName: "",
  };

  const [createForm, setCreateForm] = useState<CreateBookingDto>(emptyForm);
  const [editForm, setEditForm] = useState<CreateBookingDto>(emptyForm);

  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [searchedCustomer, setSearchedCustomer] = useState<{
    id: number;
    name?: string;
    email?: string;
    phone?: string;
  } | null>(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [createPersons, setCreatePersons] = useState<number>(1);
  const [editPersons, setEditPersons] = useState<number>(1);

  // MEJORA: Sistema de búsqueda de clientes igual al de la página customers
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [availableBusinesses, setAvailableBusinesses] = useState<any[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  async function findCustomer(id: number) {
    if (!id || isNaN(id)) return;
    setSearchingCustomer(true);
    setSearchedCustomer(null);
    setErrorMessage("");
    try {
      const customer = await getCustomerById(id);
      setSearchedCustomer(customer);
    } catch (err: any) {
      console.error("Error buscando cliente:", err);
      setErrorMessage("No se encontró ningún cliente con ese ID en el sistema.");
    } finally {
      setSearchingCustomer(false);
    }
  }

  // MEJORA: Sistema de búsqueda de clientes igual al de customers (filtrado local)
  // Filtra clientes por nombre, email, teléfono o negocio en tiempo real
  const filteredCustomersForSearch = allCustomers.filter((customer) =>
    (customer.nombre ?? "").toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (customer.apellido ?? "").toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (customer.phone ?? customer.numero ?? "").toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (customer.email ?? "").toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  // Cuando el usuario escribe en el buscador
  function handleCustomerSearchInput(query: string) {
    setCustomerSearchQuery(query);
    setShowCustomerSuggestions(true);
    setSearchedCustomer(null);
  }

  // Cuando el usuario selecciona un cliente de las sugerencias
  function selectCustomerFromSuggestions(customer: any) {
    setCustomerSearchQuery(`${customer.nombre || ""} ${customer.apellido || ""}`.trim());
    setSearchedCustomer({
      id: customer.id,
      name: `${customer.nombre || ""} ${customer.apellido || ""}`.trim(),
      email: customer.email,
      phone: customer.numero || customer.phone,
    });
    updateCreateForm("customerId", customer.id);
    setShowCustomerSuggestions(false);
  }

  // MEJORA: Cargamos todos los clientes y negocios disponibles al montar el componente
  useEffect(() => {
    async function loadInitialData() {
      setLoadingCustomers(true);
      setLoadingBusinesses(true);
      try {
        // Cargar clientes solo si el usuario es admin o empresa
        if (user?.role === "admin" || user?.role === "empresa") {
          const customers = await getCustomers();
          setAllCustomers(customers);
        }
      } catch (err) {
        console.error("Error cargando clientes:", err);
        setAllCustomers([]);
      } finally {
        setLoadingCustomers(false);
      }

      try {
        // Cargar negocios disponibles
        const businesses = await getBusinesses();
        setAvailableBusinesses(businesses);
      } catch (err) {
        console.error("Error cargando negocios:", err);
        // Fallback si el endpoint no existe aún
        setAvailableBusinesses(
          Object.entries(BUSINESS_NAMES).map(([id, name]) => ({
            id: Number(id),
            nombre: name,
          }))
        );
      } finally {
        setLoadingBusinesses(false);
      }
    }
    loadInitialData();
  }, []);

  // 2. Creamos las referencias para los contenedores de los formularios
  const createFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  // Filtra las reservas según el rol del usuario.
  // IMPORTANTE: comparamos con Number() para evitar que la comparación
  // === falle si businessId/userId vienen como string desde el backend.
  const roleFilteredBookings = useMemo(() => {
    if (user?.role === "empresa") {
      // El backend ya filtra por empresa, pero hacemos doble comprobación local
      return bookings.filter((b) => Number(b.businessId) === Number(user.businessId));
    } else if (user?.role === "usuario") {
      // El usuario ve solo sus propias reservas (comparamos por userId o customerId)
      return bookings.filter(
        (b) => Number((b as any).userId) === Number(user.id) ||
               Number(b.customerId) === Number(user.customerId)
      );
    }
    // admin ve todo
    return bookings;
  }, [bookings, user]);

  const filteredBookings = useMemo(() => {
    let result = roleFilteredBookings;
    if (statusFilter !== "all") {
      result = roleFilteredBookings.filter((booking) => booking.status === statusFilter);
    }
    // Limitamos la cantidad de reservas visibles a un máximo de 30 
    // para evitar sobrecargar la interfaz y mantener un buen rendimiento.
    return result.slice(0, 30);
  }, [roleFilteredBookings, statusFilter]);

  const totalCount = roleFilteredBookings.length;
  const pendingCount = roleFilteredBookings.filter((b) => b.status === "pending").length;
  const confirmedCount = roleFilteredBookings.filter((b) => b.status === "confirmed").length;
  const paidCount = roleFilteredBookings.filter((b) => b.status === "paid").length;

  const latestBooking = user?.role === "usuario" ? filteredBookings[0] : undefined;

  function updateCreateForm<K extends keyof CreateBookingDto>(
    key: K,
    value: CreateBookingDto[K]
  ) {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateEditForm<K extends keyof CreateBookingDto>(
    key: K,
    value: CreateBookingDto[K]
  ) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetCreateForm() { setCreateForm(emptyForm); }
  function resetEditForm() { setEditForm(emptyForm); }

  // 3. Modificamos la apertura para añadir el scroll
  function openCreateForm() {
    setSuccessMessage("");
    setErrorMessage("");
    setSuccessMessage("");
    setEditingBookingId(null);
    setDeleteTargetId(null);
    resetEditForm();
    setIsCreateOpen(true);

    // Limpiar estados de búsqueda de cliente (sistema igual a customers)
    setCustomerSearchQuery("");
    setShowCustomerSuggestions(false);
    setSearchedCustomer(null);

    // Auto-asignamos los identificadores reales que vienen del token/auth
    const initialCustomerId = user?.role === "usuario" ? (user.customerId || 1) : 1;
    const initialBusinessId = user?.role === "empresa" ? (user.businessId || 1) : 1;

    setCreateForm({
      date: getTodayString(),
      time: getCurrentTimeString(),
      status: "pending",
      customerId: initialCustomerId,
      businessId: initialBusinessId,
      serviceName: "",
    });

    // El setTimeout asegura que el DOM ya se actualizó y el elemento existe
    setTimeout(() => {
      createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function closeCreateForm() {
    setErrorMessage("");
    resetCreateForm();
    setIsCreateOpen(false);
  }

  function openEditForm(booking: Booking) {
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreateOpen(false);
    setDeleteTargetId(null);
    setEditingBookingId(booking.id);
    let cleanServiceName = booking.serviceName ?? "";
    let parsedPersons = 1;
    const match = (booking.serviceName ?? "").match(/(.*) \((\d+) personas?\)/);
    if (match) {
      cleanServiceName = match[1].trim();
      parsedPersons = Number(match[2]);
    }

    setEditPersons(parsedPersons);
    setEditForm({
      date: booking.date,
      time: booking.time,
      status: booking.status,
      customerId: booking.customerId,
      businessId: booking.businessId,
      serviceName: booking.serviceName,
    });

    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function closeEditForm() {
    setErrorMessage("");
    setEditingBookingId(null);
    resetEditForm();
  }

  function openDeleteModal(id: number) {
    setErrorMessage("");
    setSuccessMessage("");
    setDeleteTargetId(id);
  }

  function closeDeleteModal() { setDeleteTargetId(null); }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingCreate(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const finalServiceName = `${createForm.serviceName} (${createPersons} ${createPersons === 1 ? 'persona' : 'personas'})`;
      const payload = {
        ...createForm,
        serviceName: finalServiceName,
      };

      const created = await createAppointment(payload);
      setBookings((prev) => [created, ...prev]);
      resetCreateForm();
      setCreatePersons(1);
      setSearchedCustomer(null);
      setIsCreateOpen(false);
      setSuccessMessage("Reserva creada correctamente.");
    } catch {
      setErrorMessage("No se pudo crear la reserva. Revisa los datos o el backend.");
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingBookingId) return;

    setLoadingEdit(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const finalServiceName = `${editForm.serviceName} (${editPersons} ${editPersons === 1 ? 'persona' : 'personas'})`;
      const payload: UpdateBookingDto = {
        date: editForm.date,
        time: editForm.time,
        status: editForm.status,
        serviceName: editForm.serviceName,
      };

      const updated = await updateAppointment(editingBookingId, payload);

      setBookings((prev) =>
        prev.map((booking) => booking.id === editingBookingId ? updated : booking)
      );

      setEditingBookingId(null);
      resetEditForm();
      setSuccessMessage("Reserva actualizada correctamente.");
    } catch {
      setErrorMessage("No se pudo actualizar la reserva.");
    } finally {
      setLoadingEdit(false);
    }
  }

  async function confirmDelete() {
    if (deleteTargetId === null) return;

    setDeletingBookingId(deleteTargetId);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await deleteAppointment(deleteTargetId);
      setBookings((prev) => prev.filter((booking) => booking.id !== deleteTargetId));

      if (editingBookingId === deleteTargetId) closeEditForm();

      setSuccessMessage("Reserva personalizada eliminada con éxito.");
      closeDeleteModal();
    } catch {
      setErrorMessage("No se pudo eliminar la reserva.");
    } finally {
      setDeletingBookingId(null);
    }
  }

  return (
    <div className="booking-page page-stack">
      <section className="page-hero booking-hero">
        <div>
          <h2>{texts[language].title}</h2>
          <p>{texts[language].subtitle}</p>
        </div>

        {user && (
          <button className="primary-btn" type="button" onClick={openCreateForm}>
            {texts[language].newBooking}
          </button>
        )}
      </section>

      {/* Ocultamos las tarjetas KPI si el rol es un cliente convencional */}
      {user?.role !== "usuario" && (
        <section className="kpi-grid">
          <KpiCard
            title={texts[language].totalBookings}
            value={totalCount}
            trend={texts[language].availableRecords}
            color={KPI_COLORS.teal}
            activity={ACTIVITY_DATA.total}
          />

          <KpiCard
            title={texts[language].pending}
            value={pendingCount}
            trend={texts[language].needsFollowUp}
            color={KPI_COLORS.amber}
            activity={ACTIVITY_DATA.pending}
          />

          <KpiCard
            title={texts[language].confirmed}
            value={confirmedCount}
            trend={texts[language].activeStatus}
            color={KPI_COLORS.green}
            activity={ACTIVITY_DATA.confirmed}
          />

          <KpiCard
            title={texts[language].paid}
            value={paidCount}
            trend={texts[language].closedBookings}
            color={KPI_COLORS.purple}
            activity={ACTIVITY_DATA.paid}
          />
        </section>
      )}

      {isCreateOpen && (
        <section ref={createFormRef} className="section-card booking-form-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nueva reserva</h3>
            <button type="button" className="secondary-btn" onClick={closeCreateForm}>
              Cancelar
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].date}</label>
                <input
                  className="input"
                  type="date"
                  min={getTodayString()}
                  value={createForm.date}
                  onChange={(e) => updateCreateForm("date", e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].time}</label>
                <input
                  className="input"
                  type="time"
                  value={createForm.time}
                  onChange={(e) => updateCreateForm("time", e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].status}</label>
                <select
                  className="select"
                  value={createForm.status}
                  onChange={(e) =>
                    updateCreateForm("status", e.target.value as BookingStatus)
                  }
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="paid">Pagada</option>
                </select>
              </div>

              {user?.role !== "usuario" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                    {/* MEJORA: Sistema de búsqueda de clientes igual a la página de customers */}
                    Buscar Cliente por Nombre
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Busca por nombre, apellido, email o teléfono..."
                    value={customerSearchQuery}
                    onChange={(e) => handleCustomerSearchInput(e.target.value)}
                    onFocus={() => setShowCustomerSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                    style={{ flex: 1 }}
                  />
                  
                  {/* Panel de sugerencias inspirado en customers: lista filtrada localmente */}
                  {showCustomerSuggestions && customerSearchQuery.length >= 1 && filteredCustomersForSearch.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: "4px",
                        backgroundColor: "#fff",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        maxHeight: "280px",
                        overflowY: "auto",
                      }}
                    >
                      {filteredCustomersForSearch.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => selectCustomerFromSuggestions(customer)}
                          style={{
                            padding: "12px 14px",
                            cursor: "pointer",
                            borderBottom: "1px solid rgba(0,0,0,0.05)",
                            transition: "background-color 0.2s",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(29, 158, 117, 0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <strong style={{ fontSize: "13px", color: "#1f2937" }}>
                            👤 {customer.nombre || ""} {customer.apellido || ""}
                          </strong>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            📧 {customer.email || "Sin email"}
                          </span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            📱 {customer.numero || customer.phone || "Sin teléfono"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {showCustomerSuggestions && customerSearchQuery.length >= 1 && filteredCustomersForSearch.length === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: "4px",
                        backgroundColor: "#fff",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        fontSize: "13px",
                        color: "var(--text-muted)",
                        zIndex: 1000,
                      }}
                    >
                      ❌ No se encontraron clientes con esa búsqueda
                    </div>
                  )}

                  {loadingCustomers && (
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                      ⏳ Cargando clientes...
                    </div>
                  )}
                </div>
              )}

              {user?.role === "admin" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                    {/* MEJORA: Cambio de "ID Negocio" a "Nombre del Negocio" con desplegable */}
                    {texts[language].business}
                  </label>
                  <select
                    className="select"
                    value={createForm.businessId}
                    onChange={(e) => updateCreateForm("businessId", Number(e.target.value))}
                    required
                    style={{ padding: "13px 16px" }}
                  >
                    <option value="">-- Selecciona un negocio --</option>
                    {availableBusinesses.length > 0 ? (
                      availableBusinesses.map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.nombre || business.name || `Negocio #${business.id}`}
                        </option>
                      ))
                    ) : (
                      <option disabled>Cargando negocios...</option>
                    )}
                  </select>
                </div>
              )}

              {user?.role === "usuario" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].business}</label>
                  <select
                    className="select"
                    value={createForm.businessId}
                    onChange={(e) => updateCreateForm("businessId", Number(e.target.value))}
                    required
                    style={{ padding: "13px 16px" }}
                  >
                    <option value="">-- Selecciona un negocio --</option>
                    {availableBusinesses.length > 0 ? (
                      availableBusinesses.map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.nombre || business.name || `Negocio #${business.id}`}
                        </option>
                      ))
                    ) : (
                      Object.entries(BUSINESS_NAMES).map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))
                    )}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].people}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setCreatePersons(prev => Math.max(1, prev - 1))}
                    style={{ padding: '8px 16px', fontSize: '16px', fontWeight: 'bold' }}
                  >
                    -
                  </button>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={5}
                    value={createPersons}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (val < 1) val = 1;
                      if (val > 5) val = 5;
                      setCreatePersons(val);
                    }}
                    style={{ width: '60px', textAlign: 'center', fontWeight: 'bold' }}
                    required
                  />
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setCreatePersons(prev => Math.min(5, prev + 1))}
                    style={{ padding: '8px 16px', fontSize: '16px', fontWeight: 'bold' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="input--full" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].service}</label>
                <input
                  className="input"
                  type="text"
                  value={createForm.serviceName}
                  onChange={(e) => updateCreateForm("serviceName", e.target.value)}
                  placeholder="Servicio"
                  required
                />
              </div>
            </div>

            {searchedCustomer && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(46, 204, 113, 0.08)',
                border: '1px solid rgba(46, 204, 113, 0.3)',
                color: '#27ae60',
                fontSize: '13px'
              }}>
                <strong style={{ fontSize: "14px", color: "#219653" }}>
                  ✓ {texts[language].customerFound}
                </strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                  <span><strong>{texts[language].name}:</strong> {searchedCustomer.name ?? "-"}</span>
                  <span><strong>Email:</strong> {searchedCustomer.email ?? "-"}</span>
                  <span><strong>{texts[language].phone}:</strong> {searchedCustomer.phone ?? "-"}</span>
                </div>
              </div>
            )}

            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? "Guardando..." : "Crear reserva"}
              </button>
            </div>
          </form>
        </section>
      )}

      {editingBookingId !== null && (
        <section ref={editFormRef} className="section-card booking-form-card">
          <div className="panel-title-row">
            <h3 className="panel-title">
              {texts[language].editBookingTitle} #{editingBookingId}
            </h3>

            <button type="button" className="secondary-btn" onClick={closeEditForm}>
              {texts[language].cancel}
            </button>
          </div>
          <form onSubmit={handleEditSubmit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {texts[language].date}
                </label>
                <input
                  className="input"
                  type="date"
                  min={getTodayString()}
                  value={editForm.date}
                  onChange={(e) => updateEditForm("date", e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {texts[language].time}
                </label>
                <input
                  className="input"
                  type="time"
                  value={editForm.time}
                  onChange={(e) => updateEditForm("time", e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {texts[language].status}
                </label>
                <select
                  className="select"
                  value={editForm.status}
                  onChange={(e) =>
                    updateEditForm("status", e.target.value as BookingStatus)
                  }
                >
                  <option value="pending">{texts[language].pendingOption}</option>
                  <option value="confirmed">{texts[language].confirmedOption}</option>
                  <option value="paid">{texts[language].paidOption}</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {texts[language].customerId}
                </label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={editForm.customerId}
                  placeholder={texts[language].customerId}
                  disabled
                  title="El Customer ID no se puede modificar una vez creada la reserva"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {texts[language].businessId}
                </label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={editForm.businessId}
                  placeholder={texts[language].businessId}
                  disabled
                  title="El Business ID no se puede modificar una vez creada la reserva"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {texts[language].people}
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setEditPersons((prev) => Math.max(1, prev - 1))}
                    style={{ padding: "8px 16px", fontSize: "16px", fontWeight: "bold" }}
                  >
                    -
                  </button>

                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={5}
                    value={editPersons}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (val < 1) val = 1;
                      if (val > 5) val = 5;
                      setEditPersons(val);
                    }}
                    style={{ width: "60px", textAlign: "center", fontWeight: "bold" }}
                    required
                  />

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setEditPersons((prev) => Math.min(5, prev + 1))}
                    style={{ padding: "8px 16px", fontSize: "16px", fontWeight: "bold" }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="input--full" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {texts[language].service}
                </label>
                <input
                  className="input"
                  type="text"
                  value={editForm.serviceName}
                  onChange={(e) => updateEditForm("serviceName", e.target.value)}
                  placeholder={texts[language].service}
                  required
                />
              </div>
            </div>

            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingEdit}>
                {loadingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      )}

      {deleteTargetId !== null && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) closeDeleteModal(); }}>
          <div className="modal-card">
            <div className="modal-icon">!</div>
            <h3 className="modal-title">Eliminar reserva</h3>
            <p className="modal-text">¿Seguro que quieres eliminar la reserva #{deleteTargetId}?</p>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={closeDeleteModal}>Cancelar</button>
              <button type="button" className="danger-btn" onClick={confirmDelete} disabled={deletingBookingId === deleteTargetId}>
                {deletingBookingId === deleteTargetId ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="section-card booking-table-card">
        <div className="panel-title-row">
          <h3 className="panel-title">
            {user?.role === "usuario" ? "Detalle de mi reserva" : "Reservas registradas"}
          </h3>
          <div className="filter-row">
            {(["all", "pending", "confirmed", "paid"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`filter-pill ${statusFilter === f ? "filter-pill--active" : ""}`}
                aria-pressed={statusFilter === f}
                onClick={() => setStatusFilter(f)}
              >
                {{ all: "Todas", pending: "Pendientes", confirmed: "Confirmadas", paid: "Pagadas" }[f]}
              </button>
            ))}
          </div>
        </div>
        {successMessage ? <div className="message-success" style={{ marginBottom: 12 }}>{successMessage}</div> : null}
        {errorMessage ? <div className="message-error" style={{ marginBottom: 12 }}>{errorMessage}</div> : null}

        {/* Tabla de reservas unificada para todos los roles.
            El rol usuario ve las mismas columnas que admin/empresa pero sin la columna de Acciones. */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Servicio</th>
                <th>Cliente</th>
                <th>Comercio</th>
                <th>Estado</th>
                {/* Columna de acciones solo visible para admin y empresa */}
                {user?.role !== "usuario" && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={user?.role !== "usuario" ? 8 : 7} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                    No tienes ninguna reserva registrada todavía.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td style={{ fontWeight: 600 }}>{booking.id}</td>
                    <td>{formatDate(booking.date ?? "")}</td>
                    <td>{booking.time}</td>
                    <td>{booking.serviceName || (booking as any).service?.nombre || "—"}</td>
                    <td>{(booking as any).customerName || booking.customerId || "—"}</td>
                    <td>{(booking as any).businessName || BUSINESS_NAMES[booking.businessId ?? 0] || `#${booking.businessId ?? "?"}`}</td>
                    <td><StatusBadge status={(booking.status as BookingStatus) ?? "pending"} /></td>
                    {/* Botones de editar/eliminar solo para admin y empresa */}
                    {user?.role !== "usuario" && (
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => openEditForm(booking)}
                          >
                            {texts[language].edit}
                          </button>
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => openDeleteModal(booking.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </section>
    </div>
  );
}