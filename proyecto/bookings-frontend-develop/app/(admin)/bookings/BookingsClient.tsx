"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
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

function StatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, string> = {
    pending:   "Pendiente",
    confirmed: "Confirmada",
    paid:      "Pagada",
    canceled:  "Cancelada",
    completed: "Completada",
  };
  return <span className={`badge badge--${status}`}>{map[status] ?? status}</span>;
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

export default function BookingsClient({
  initialBookings,
}: {
  initialBookings: Booking[];
}) {
  const { user } = useAuth();
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

  // ─── FILTRADO INTELIGENTE POR ROL ───────────────────────────────────────────
  // Aquí ocurre la magia: filtramos los datos de origen según quién inició sesión
  const bookingsFiltradosPorRol = useMemo(() => {
    return bookings.filter((booking) => {
      if (user?.role === "usuario") {
        return booking.customerId === user.customerId;
      }
      if (user?.role === "empresa") {
        return booking.businessId === user.businessId;
      }
      return true; // El admin ve todo
    });
  }, [bookings, user]);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return bookingsFiltradosPorRol;
    return bookingsFiltradosPorRol.filter((booking) => booking.status === statusFilter);
  }, [bookingsFiltradosPorRol, statusFilter]);

  // Las estadísticas se calculan dinámicamente en base a lo que el rol tiene permitido ver
  const totalCount = bookingsFiltradosPorRol.length;
  const pendingCount = bookingsFiltradosPorRol.filter((b) => b.status === "pending").length;
  const confirmedCount = bookingsFiltradosPorRol.filter((b) => b.status === "confirmed").length;
  const paidCount = bookingsFiltradosPorRol.filter((b) => b.status === "paid").length;

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
    resetEditForm();
    setIsCreateOpen(true);

    // Auto-asignamos los identificadores reales que vienen del token/auth
    const initialCustomerId = user?.role === "usuario" ? (user.customerId || 1) : 1;
    const initialBusinessId = user?.role === "empresa" ? (user.businessId || 1) : 1;

    setCreateForm({
      date: "",
      time: "",
      status: "pending",
      customerId: initialCustomerId,
      businessId: initialBusinessId,
      serviceName: "",
    });

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
      const created = await createAppointment(createForm);
      setBookings((prev) => [created, ...prev]);
      resetCreateForm();
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
          <h2>
            {user?.role === "usuario" ? "Mis Reservas" : "Listado de Reservas"}
          </h2>
          <p>
            {user?.role === "usuario" 
              ? "Aquí puedes ver e inscribir tus citas activas." 
              : "Gestión de reservas conectada con la API."}
          </p>
        </div>

        {/* El botón para crear reservas está disponible para Admins y Usuarios particulares */}
        {user?.role !== "empresa" && (
          <button className="primary-btn" type="button" onClick={openCreateForm}>
            Nueva reserva
          </button>
        )}
      </section>

      {/* Ocultamos las tarjetas KPI si el rol es un cliente convencional */}
      {user?.role !== "usuario" && (
        <section className="kpi-grid">
          <KpiCard
            title="Total reservas"
            value={totalCount}
            trend="registros disponibles"
            color={KPI_COLORS.teal}
            activity={ACTIVITY_DATA.total}
          />
          <KpiCard
            title="Pendientes"
            value={pendingCount}
            trend="requieren seguimiento"
            color={KPI_COLORS.amber}
            activity={ACTIVITY_DATA.pending}
          />
          <KpiCard
            title="Confirmadas"
            value={confirmedCount}
            trend="estado activo"
            color={KPI_COLORS.green}
            activity={ACTIVITY_DATA.confirmed}
          />
          <KpiCard
            title="Pagadas"
            value={paidCount}
            trend="reservas cerradas"
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
              <input
                className="input"
                type="date"
                value={createForm.date}
                onChange={(e) => updateCreateForm("date", e.target.value)}
                required
              />
              <input
                className="input"
                type="time"
                value={createForm.time}
                onChange={(e) => updateCreateForm("time", e.target.value)}
                required
              />
              
              {/* Bloqueamos el selector de estados si es un usuario común para que empiece en pending obligatoriamente */}
              <select
                className="select"
                value={createForm.status}
                disabled={user?.role === "usuario"}
                onChange={(e) =>
                  updateCreateForm("status", e.target.value as BookingStatus)
                }
              >
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="paid">Pagada</option>
              </select>

              {/* Si es Admin muestra los inputs numéricos de control, si no, se auto-asignan de forma oculta */}
              {user?.role === "admin" ? (
                <>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={createForm.customerId}
                    onChange={(e) => updateCreateForm("customerId", Number(e.target.value))}
                    placeholder="Customer ID"
                    required
                  />
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={createForm.businessId}
                    onChange={(e) => updateCreateForm("businessId", Number(e.target.value))}
                    placeholder="Business ID"
                    required
                  />
                </>
              ) : user?.role === "usuario" ? (
                <select 
                  className="select"
                  value={createForm.businessId}
                  onChange={(e) => updateCreateForm("businessId", Number(e.target.value))}
                >
                  {Object.entries(BUSINESS_NAMES).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              ) : null}

              <input
                className={`input ${user?.role !== "admin" ? "input--full" : ""}`}
                type="text"
                value={createForm.serviceName}
                onChange={(e) => updateCreateForm("serviceName", e.target.value)}
                placeholder="Servicio solicitado (Ej: Corte de pelo)"
                required
              />
            </div>

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
            <h3 className="panel-title">Editar reserva #{editingBookingId}</h3>
            <button type="button" className="secondary-btn" onClick={closeEditForm}>
              Cancelar
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <input
                className="input"
                type="date"
                value={editForm.date}
                onChange={(e) => updateEditForm("date", e.target.value)}
                required
              />
              <input
                className="input"
                type="time"
                value={editForm.time}
                onChange={(e) => updateEditForm("time", e.target.value)}
                required
              />
              <select
                className="select"
                value={editForm.status}
                disabled={user?.role === "usuario"}
                onChange={(e) => updateEditForm("status", e.target.value as BookingStatus)}
              >
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="paid">Pagada</option>
                <option value="canceled">Cancelar Reserva</option>
              </select>
              <input
                className="input"
                type="text"
                value={editForm.serviceName}
                onChange={(e) => updateEditForm("serviceName", e.target.value)}
                placeholder="Servicio"
                required
              />
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
            {user?.role === "usuario" ? "Mis Citas Solicitadas" : "Reservas registradas"}
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
        {errorMessage   ? <div className="message-error"   style={{ marginBottom: 12 }}>{errorMessage}</div>   : null}

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Servicio</th>
                {user?.role !== "usuario" && <th>Customer ID</th>}
                {user?.role !== "empresa" && <th>Comercio</th>}
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td style={{ fontWeight: 600 }}>{booking.id}</td>
                  <td>{formatDate(booking.date)}</td>
                  <td>{booking.time}</td>
                  <td>{booking.serviceName}</td>
                  {user?.role !== "usuario" && <td>{booking.customerId}</td>}
                  {user?.role !== "empresa" && (
                    <td>{BUSINESS_NAMES[booking.businessId] || `Comercio #${booking.businessId}`}</td>
                  )}
                  <td><StatusBadge status={booking.status} /></td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="secondary-btn" onClick={() => openEditForm(booking)}>
                        Editar
                      </button>
                      {user?.role !== "empresa" && (
                        <button type="button" className="secondary-btn" onClick={() => openDeleteModal(booking.id)}>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}