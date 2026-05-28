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
  updateAppointment,
} from "@/lib/api";

const BUSINESS_NAMES: Record<number, string> = {
  1: "Peluquería Nova",
  2: "Restaurante Marea",
  3: "Barber Studio",
  4: "Gimnasio Fit",
  5: "Clínica Dental",
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────
// MODIFICADO: StatusBadge ahora cubre todos los estados del backend usando un map tipado.
// Antes usaba ternarios encadenados que dejaban fuera "canceled" y "completed".
function StatusBadge({ status }: { status: BookingStatus }) {
  // Map completo de status → etiqueta legible en español
  const map: Record<BookingStatus, string> = {
    pending:   "Pendiente",
    confirmed: "Confirmada",
    paid:      "Pagada",
    canceled:  "Cancelada",
    completed: "Completada",
  };
  return <span className={`badge badge--${status}`}>{map[status] ?? status}</span>;
}

// ─── formatDate ───────────────────────────────────────────────────────────────
// Formatea una fecha ISO "YYYY-MM-DD" a formato local "dd/mm/yyyy".
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

// ─── KpiCard — Variante D ──────────────────────────────────────────────────────
// NUEVO: Componente KpiCard rediseñado con la Variante D, mismo que usa dashboard/page.tsx.
interface KpiCardColor {
  // Color del borde lateral izquierdo y de las barras del histograma
  bar: string;
  // Fondo del badge de tendencia
  trendBg: string;
  // Color del texto del badge de tendencia
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
    bar:       "#1D9E75",
    trendBg:   "#E1F5EE",
    trendText: "#085041",
  },
  amber: {
    bar:       "#EF9F27",
    trendBg:   "#FAEEDA",
    trendText: "#412402",
  },
  green: {
    bar:       "#22C55E",
    trendBg:   "#DCFCE7",
    trendText: "#14532D",
  },
  purple: {
    bar:       "#7F77DD",
    trendBg:   "#EEEDFE",
    trendText: "#26215C",
  },
};

const ACTIVITY_DATA = {
  total:     [50, 65, 55, 75, 60, 85, 70, 90, 75, 95, 80, 100, 90, 110],
  pending:   [60, 40, 70, 30, 50, 20, 40, 35, 55, 25, 45, 30, 50, 20],
  confirmed: [40, 55, 35, 70, 60, 80, 75, 90, 65, 85, 70, 95, 80, 100],
  paid:      [30, 45, 20, 55, 40, 65, 50, 70, 45, 60, 55, 80, 65, 90],
};

// ─── BookingsClient ───────────────────────────────────────────────────────────
export default function BookingsClient({
  initialBookings,
}: {
  initialBookings: Booking[];
}) {
  const { user } = useAuth();

  // Obtenemos el idioma global para traducir los textos de bookings
const { language } = useLanguage();

// Textos de la página bookings en español e inglés
const texts = {
  es: {
    title: "Lista de reservas",
    subtitle: "Gestión de reservas conectada con la API.",
    newBooking: "Nueva reserva",
    totalBookings: "Total reservas",
    pending: "Pendientes",
    confirmed: "Confirmadas",
    paid: "Pagadas",
    availableRecords: "Registros disponibles",
    needsFollowUp: "Requieren seguimiento",
    activeStatus: "Estado activo",
    closedBookings: "Reservas cerradas",
    newBookingTitle: "Nueva reserva",
    editBookingTitle: "Editar reserva",
    cancel: "Cancelar",
    date: "Fecha",
    time: "Hora",
    status: "Estado",
    pendingOption: "Pendiente",
    confirmedOption: "Confirmada",
    paidOption: "Pagada",
    customerId: "ID Cliente",
    businessId: "ID Negocio",
    business: "Comercio",
    people: "Personas (1-5)",
    service: "Servicio",
    search: "Buscar",
    searching: "Buscando...",
    customerFound: "Cliente seleccionado encontrado:",
    name: "Nombre",
    phone: "Teléfono",
    createBooking: "Crear reserva",
    creating: "Guardando...",
    saveChanges: "Guardar cambios",
    saving: "Guardando...",
    registeredBookings: "Reservas registradas",
    all: "Todas",
    id: "ID",
    customer: "Customer",
    actions: "Acciones",
    edit: "Editar",
    delete: "Eliminar",
    deleteTitle: "Eliminar reserva",
    deleteText: "¿Seguro que quieres eliminar la reserva",
    deleteWarning: "Esta acción no se puede deshacer.",
    deleting: "Eliminando...",
  },
  en: {
    title: "Bookings list",
    subtitle: "Booking management connected to the API.",
    newBooking: "New booking",
    totalBookings: "Total bookings",
    pending: "Pending",
    confirmed: "Confirmed",
    paid: "Paid",
    availableRecords: "Available records",
    needsFollowUp: "Needs follow-up",
    activeStatus: "Active status",
    closedBookings: "Closed bookings",
    newBookingTitle: "New booking",
    editBookingTitle: "Edit booking",
    cancel: "Cancel",
    date: "Date",
    time: "Time",
    status: "Status",
    pendingOption: "Pending",
    confirmedOption: "Confirmed",
    paidOption: "Paid",
    customerId: "Customer ID",
    businessId: "Business ID",
    business: "Business",
    people: "People (1-5)",
    service: "Service",
    search: "Search",
    searching: "Searching...",
    customerFound: "Selected customer found:",
    name: "Name",
    phone: "Phone",
    createBooking: "Create booking",
    creating: "Saving...",
    saveChanges: "Save changes",
    saving: "Saving...",
    registeredBookings: "Registered bookings",
    all: "All",
    id: "ID",
    customer: "Customer",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    deleteTitle: "Delete booking",
    deleteText: "Are you sure you want to delete booking",
    deleteWarning: "This action cannot be undone.",
    deleting: "Deleting...",
  },
};

  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getCurrentTimeString = () => {
    const today = new Date();
    const hours = String(today.getHours()).padStart(2, "0");
    const minutes = String(today.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const emptyForm: CreateBookingDto = {
    date: getTodayString(),
    time: getCurrentTimeString(),
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

  const [searchedCustomer, setSearchedCustomer] = useState<{ id: number; name: string; email: string; phone: string } | null>(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [createPersons, setCreatePersons] = useState<number>(1);
  const [editPersons, setEditPersons] = useState<number>(1);

  async function findCustomer(id: number) {
    if (!id || isNaN(id)) return;
    setSearchingCustomer(true);
    setSearchedCustomer(null);
    setErrorMessage("");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${API_URL}/customers/${id}`);
      if (!res.ok) {
        throw new Error("Cliente no encontrado");
      }
      const customer = await res.json();
      setSearchedCustomer(customer);
    } catch (err: any) {
      setErrorMessage("No se encontró ningún cliente con ese ID en el sistema.");
    } finally {
      setSearchingCustomer(false);
    }
  }

  const createFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  const roleFilteredBookings = useMemo(() => {
    if (user?.role === "empresa") {
      return bookings.filter((b) => b.businessId === user.businessId);
    } else if (user?.role === "usuario") {
      return bookings.filter((b) => b.customerId === user.customerId);
    }
    return bookings;
  }, [bookings, user]);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return roleFilteredBookings;
    return roleFilteredBookings.filter((booking) => booking.status === statusFilter);
  }, [roleFilteredBookings, statusFilter]);

  const totalCount = roleFilteredBookings.length;
  const pendingCount = roleFilteredBookings.filter((b) => b.status === "pending").length;
  const confirmedCount = roleFilteredBookings.filter((b) => b.status === "confirmed").length;
  const paidCount = roleFilteredBookings.filter((b) => b.status === "paid").length;

  // ─── Helpers de formulario ─────────────────────────────────────────────────
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
  function resetEditForm()   { setEditForm(emptyForm); }

  function openCreateForm() {
    setSuccessMessage(""); 
    setErrorMessage("");
    setEditingBookingId(null);
    setDeleteTargetId(null);
    setCreatePersons(1);
    setSearchedCustomer(null);
    resetEditForm();
    setIsCreateOpen(true);

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

    setTimeout(() => {
      createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  // ─── Handlers async ────────────────────────────────────────────────────────
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

    let cleanServiceName = booking.serviceName;
    let parsedPersons = 1;
    const match = booking.serviceName.match(/(.*) \((\d+) personas?\)/);
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
      serviceName: cleanServiceName,
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
        serviceName: finalServiceName,
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

      setSuccessMessage("Reserva eliminada correctamente.");
      closeDeleteModal();
    } catch {
      setErrorMessage("No se pudo eliminar la reserva.");
    } finally {
      setDeletingBookingId(null);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="booking-page page-stack">
      <section className="page-hero booking-hero">
        <div>
          <h2>{texts[language].title}</h2>
          <p>{texts[language].subtitle}</p>
        </div>

        <button className="primary-btn" type="button" onClick={openCreateForm}>
         {texts[language].newBooking}
        </button>
      </section>

      <section className="kpi-grid">
<<<<<<< HEAD
        <div className="kpi-card">
          <p className="kpi-card__label">{texts[language].totalBookings}</p>
          <h3 className="kpi-card__value">{totalCount}</h3>
          <p className="kpi-card__meta">{texts[language].availableRecords}</p>
        </div>

        <div className="kpi-card">
          <p className="kpi-card__label">{texts[language].pending}</p>
          <h3 className="kpi-card__value">{pendingCount}</h3>
          <p className="kpi-card__meta kpi-card__meta--warning">
            {texts[language].needsFollowUp}
          </p>
        </div>

        <div className="kpi-card">
          <p className="kpi-card__label">{texts[language].confirmed}</p>
          <h3 className="kpi-card__value">{confirmedCount}</h3>
          <p className="kpi-card__meta kpi-card__meta--positive">
            {texts[language].activeStatus}
          </p>
        </div>  

        <div className="kpi-card">
          <p className="kpi-card__label">{texts[language].paid}</p>
          <h3 className="kpi-card__value">{paidCount}</h3>
          <p className="kpi-card__meta">{texts[language].closedBookings}</p>
        </div>
=======
        {/* Total reservas — teal */}
        <KpiCard
          title="Total reservas"
          value={totalCount}
          trend="registros disponibles"
          color={KPI_COLORS.teal}
          activity={ACTIVITY_DATA.total}
        />

        {/* Pendientes — amber */}
        <KpiCard
          title="Pendientes"
          value={pendingCount}
          trend="requieren seguimiento"
          color={KPI_COLORS.amber}
          activity={ACTIVITY_DATA.pending}
        />

        {/* Confirmadas — green */}
        <KpiCard
          title="Confirmadas"
          value={confirmedCount}
          trend="estado activo"
          color={KPI_COLORS.green}
          activity={ACTIVITY_DATA.confirmed}
        />

        {/* Pagadas — purple (color de marca) */}
        <KpiCard
          title="Pagadas"
          value={paidCount}
          trend="reservas cerradas"
          color={KPI_COLORS.purple}
          activity={ACTIVITY_DATA.paid}
        />
>>>>>>> origin/merge
      </section>

      {isCreateOpen && (
        <section ref={createFormRef} className="section-card booking-form-card">
          <div className="panel-title-row">
            <h3 className="panel-title">{texts[language].newBookingTitle}</h3>
            <button type="button" className="secondary-btn" onClick={closeCreateForm}>
              {texts[language].cancel}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].customerId}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      value={createForm.customerId}
                      onChange={(e) => {
                        updateCreateForm("customerId", Number(e.target.value));
                        setSearchedCustomer(null);
                      }}
                      placeholder="Customer ID"
                      required
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => findCustomer(createForm.customerId)}
                      disabled={searchingCustomer}
                      style={{ whiteSpace: 'nowrap', padding: '10px 16px' }}
                    >
                      {searchingCustomer ? "Buscando..." : "Buscar"}
                    </button>
                  </div>
                </div>
              )}

              {user?.role === "admin" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].businessId}</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={createForm.businessId}
                    onChange={(e) =>
                      updateCreateForm("businessId", Number(e.target.value))
                    }
                    placeholder="Business ID"
                    required
                  />
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
                    {Object.entries(BUSINESS_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
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
                    <span><strong>{texts[language].name}:</strong> {searchedCustomer.name}</span>
                    <span><strong>Email:</strong> {searchedCustomer.email}</span>
                    <span><strong>{texts[language].phone}:</strong> {searchedCustomer.phone}</span>
                  </div>
                </div>
          )}

            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? texts[language].creating : texts[language].createBooking}
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
        {loadingEdit ? texts[language].saving : texts[language].saveChanges}
      </button>
    </div>
  </form>
</section>
      )}

      {/* Modal de confirmación de borrado */}
      {deleteTargetId !== null && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"  
          aria-describedby="delete-modal-description"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteModal();
          }}
        >
          <div className="modal-card">
            <div className="modal-icon">!</div>
           <h3 id="delete-modal-title" className="modal-title">
            {texts[language].deleteTitle}
          </h3>
          <p id="delete-modal-description" className="modal-text">
            {texts[language].deleteText} #{deleteTargetId}? {texts[language].deleteWarning}
          </p>
            <div className="modal-actions">
<<<<<<< HEAD
              <button
                type="button"
                className="secondary-btn"
                onClick={closeDeleteModal}
              >
               {texts[language].cancel}
=======
              <button type="button" className="secondary-btn" onClick={closeDeleteModal}>
                Cancelar
>>>>>>> origin/merge
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={confirmDelete}
                disabled={deletingBookingId === deleteTargetId}
              >
               {deletingBookingId === deleteTargetId
                  ? texts[language].deleting
                  : texts[language].delete}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="section-card booking-table-card">
        <div className="panel-title-row">
<<<<<<< HEAD
          <h3 className="panel-title">{texts[language].registeredBookings}</h3>
          <div className="filter-row">
            <button
              type="button"
              className={`filter-pill ${statusFilter === "all" ? "filter-pill--active" : ""}`}
              aria-pressed={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            >
              {texts[language].all}
            </button>

            <button
              type="button"
              className={`filter-pill ${statusFilter === "pending" ? "filter-pill--active" : ""}`}
              aria-pressed={statusFilter === "pending"}
              onClick={() => setStatusFilter("pending")}
            >
              {texts[language].pending}
            </button>

            <button
              type="button"
              className={`filter-pill ${statusFilter === "confirmed" ? "filter-pill--active" : ""}`}
              aria-pressed={statusFilter === "confirmed"}
              onClick={() => setStatusFilter("confirmed")}
            >
              {texts[language].confirmed}
            </button>

            <button
              type="button"
              className={`filter-pill ${statusFilter === "paid" ? "filter-pill--active" : ""}`}
              aria-pressed={statusFilter === "paid"}
              onClick={() => setStatusFilter("paid")}
            >
              {texts[language].paid}
            </button>
=======
          <h3 className="panel-title">Reservas registradas</h3>
          {/* Filtros por estado */}
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
>>>>>>> origin/merge
          </div>
        </div>

        {successMessage ? <div className="message-success" style={{ marginBottom: 12 }}>{successMessage}</div> : null}
        {errorMessage   ? <div className="message-error"   style={{ marginBottom: 12 }}>{errorMessage}</div>   : null}

        <div className="table-responsive">
          <table className="data-table">
            <thead>
            <tr>
              <th>{texts[language].id}</th>
              <th>{texts[language].date}</th>
              <th>{texts[language].time}</th>
              <th>{texts[language].service}</th>
              <th>{texts[language].customer}</th>
              <th>{texts[language].business}</th>
              <th>{texts[language].status}</th>
              {user?.role !== "usuario" && <th>{texts[language].actions}</th>}
            </tr>
          </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td style={{ fontWeight: 600 }}>{booking.id}</td>
                  <td>{formatDate(booking.date)}</td>
                  <td>{booking.time}</td>
                  <td>{booking.serviceName}</td>
                  <td>{booking.customerId}</td>
                  <td>{BUSINESS_NAMES[booking.businessId] || `#${booking.businessId}`}</td>
                  <td><StatusBadge status={booking.status} /></td>
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
                        {texts[language].delete}
                      </button>
                    </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}