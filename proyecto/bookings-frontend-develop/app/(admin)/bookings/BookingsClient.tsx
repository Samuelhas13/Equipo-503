"use client";

// 1. Importamos useRef de React
// MODIFICADO: añadimos useEffect para animar el histograma de las KpiCard variante D
import { useMemo, useState, useRef, useEffect } from "react";

// 1. Los tipos e interfaces van a @/lib/types
import type {
  Booking,
  BookingStatus,
  CreateBookingDto,
  UpdateBookingDto,
} from "@/lib/types";

// 2. Las funciones se quedan en @/lib/api
import {
  createAppointment,
  deleteAppointment,
  updateAppointment,
} from "@/lib/api";

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
// El try/catch evita que una fecha malformada del backend rompa el render.
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
// Estructura visual:
//   - Borde izquierdo de color como indicador de categoría (sin border-radius).
//   - Cabecera: badge de tendencia alineado a la derecha.
//   - Valor numérico grande con label encima.
//   - Mini histograma de barras en la parte inferior que anima al montar el componente,
//     mostrando la actividad de los últimos N periodos con opacidad variable según magnitud.
//
// Props:
//   - title: texto del label superior
//   - value: número o string principal
//   - trend: texto corto del badge de tendencia (ej. "+3 hoy", "50%")
//   - color: objeto con las variantes de color para fondo y texto
//   - activity: array de números para el histograma (últimos periodos)
//
// Posibles mejoras futuras:
//   - Hacer el histograma clickable para navegar al detalle del periodo.
//   - Añadir tooltip al hover de cada barra con el valor exacto.

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
  // Referencia al contenedor de barras para manipular el DOM directamente.
  // Usamos DOM imperativo en lugar de state para las alturas porque son
  // animaciones de entrada que solo ocurren una vez al montar el componente.
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Si el ref no está listo todavía, no hacemos nada
    if (!barsRef.current) return;

    const container = barsRef.current;
    const max = Math.max(...activity);

    // Seleccionamos todas las barras ya renderizadas y les aplicamos la altura animada.
    // El setTimeout de 150ms da tiempo al navegador a pintar el estado inicial (height: 4px)
    // antes de transicionar, lo que activa la animación CSS de 0.8s definida en globals.css.
    const bars = container.querySelectorAll<HTMLDivElement>(".kpi-d__dot");
    setTimeout(() => {
      bars.forEach((bar, i) => {
        const v = activity[i] ?? 0;
        const heightPx = Math.round((v / max) * 24 + 4);
        // Opacidad variable: máximo=1, alto=0.65, bajo=0.3 (efecto de profundidad)
        const opacity = v === max ? 1 : v > max * 0.7 ? 0.65 : 0.3;
        bar.style.height = `${heightPx}px`;
        bar.style.opacity = String(opacity);
      });
    }, 150);
  }, [activity]);

  return (
    <div className="kpi-card kpi-card--variant-d">
      {/* Borde lateral izquierdo como indicador de categoría.
          No tiene border-radius porque solo está presente en un lado.
          El color se inyecta desde el objeto KpiCardColor via style={{}}. */}
      <div
        className="kpi-card__accent"
        style={{ background: color.bar }}
        aria-hidden="true"
      />

      {/* Cabecera: badge de tendencia en extremo opuesto */}
      <div className="kpi-card__head" style={{ justifyContent: "flex-end" }}>
        {/* Badge de tendencia: pastilla pequeña con contexto del valor (ej. "+3 hoy") */}
        <span
          className="kpi-card__trend-badge"
          style={{ background: color.trendBg, color: color.trendText }}
        >
          {trend}
        </span>
      </div>

      {/* Cuerpo: label descriptivo + valor numérico principal */}
      <p className="kpi-card__label">{title}</p>
      <p className="kpi-card__value">{value}</p>

      {/* Mini histograma de actividad reciente.
          Las barras se renderizan con height: 4px y se animan en el useEffect.
          aria-hidden="true" porque es decorativo, el valor real ya está en kpi-card__value. */}
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
              // La transición CSS interpola suavemente desde el estado inicial
              // hasta los valores calculados en el useEffect
              transition: "height 0.8s cubic-bezier(0.4,0,0.2,1), opacity 0.8s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Configuración visual de las tarjetas KPI ─────────────────────────────────
// NUEVO: Paleta de colores para cada KpiCard, sincronizada con el design system BookFlow.
// Separar los datos de presentación del JSX facilita añadir nuevas tarjetas
// o cambiar colores sin tocar el componente KpiCard.
//
// Paleta:
//   - Teal   → Total reservas  (verde positivo, indica actividad)
//   - Amber  → Pendientes      (ámbar de alerta, requiere atención)
//   - Green  → Confirmadas     (verde oscuro, estado activo)
//   - Purple → Pagadas         (púrpura de marca, indica finalización)
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

// Datos de actividad simulados para el histograma de cada KPI.
// En una versión futura estos podrían venir del backend como series temporales
// (ej. endpoint GET /appointments/stats?range=14d).
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
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  // Formulario vacío reutilizado al resetear crear y editar
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

  // 2. Creamos las referencias para los contenedores de los formularios
  const createFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  // useMemo evita recalcular el array filtrado en cada render.
  // Solo se recalcula cuando cambia bookings o statusFilter.
  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return bookings;
    return bookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter]);

  // Contadores derivados del array bookings para las KpiCards
  const totalCount     = bookings.length;
  const pendingCount   = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const paidCount      = bookings.filter((b) => b.status === "paid").length;

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

  // 3. Modificamos la apertura para añadir el scroll
  function openCreateForm() {
    setErrorMessage("");
    setSuccessMessage("");
    setEditingBookingId(null);
    setDeleteTargetId(null);
    resetEditForm();
    setIsCreateOpen(true);

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

  // 4. Modificamos la apertura de edición para añadir el scroll
  function openEditForm(booking: Booking) {
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreateOpen(false);
    setDeleteTargetId(null);
    setEditingBookingId(booking.id);
    setEditForm({
      date:        booking.date,
      time:        booking.time,
      status:      booking.status,
      customerId:  booking.customerId,
      businessId:  booking.businessId,
      serviceName: booking.serviceName,
    });

    // Desplazamiento suave hacia el formulario de edición
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

  // ─── Handlers async ────────────────────────────────────────────────────────
  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingCreate(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const created = await createAppointment(createForm);
      // Añadimos la nueva reserva al inicio del array para que aparezca primera
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
        date:        editForm.date,
        time:        editForm.time,
        status:      editForm.status,
        customerId:  editForm.customerId,
        businessId:  editForm.businessId,
        serviceName: editForm.serviceName,
      };

      const updated = await updateAppointment(editingBookingId, payload);

      // Reemplazamos solo la reserva editada en el array, el resto no cambia
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
      // Eliminamos la reserva del estado local sin necesidad de refetch
      setBookings((prev) => prev.filter((booking) => booking.id !== deleteTargetId));

      // Si se estaba editando la reserva eliminada, cerramos el formulario de edición
      if (editingBookingId === deleteTargetId) closeEditForm();

      setSuccessMessage("Reserva CLI eliminada correctamente.");
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
          <h2>Bookings list</h2>
          <p>Gestión de reservas conectada con la API.</p>
        </div>

        <button className="primary-btn" type="button" onClick={openCreateForm}>
          Nueva reserva
        </button>
      </section>

      {/* ── KPIs variante D ──────────────────────────────────────────────────
          MODIFICADO: Reemplazamos los cuatro .kpi-card estáticos por el componente
          KpiCard con la Variante D: badge de tendencia y mini histograma (sin icono).
          Los valores siguen siendo reactivos a los cambios del array bookings. */}
      <section className="kpi-grid">
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
      </section>

      {isCreateOpen && (
        // 5. AÑADIDO: ref={createFormRef} al elemento section para el scroll automático
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
              <input
                className="input"
                type="number"
                min={1}
                value={createForm.customerId}
                onChange={(e) =>
                  updateCreateForm("customerId", Number(e.target.value))
                }
                placeholder="Customer ID"
                required
              />
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
              <input
                className="input input--full"
                type="text"
                value={createForm.serviceName}
                onChange={(e) => updateCreateForm("serviceName", e.target.value)}
                placeholder="Servicio"
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
        // 6. AÑADIDO: ref={editFormRef} al elemento section para el scroll automático
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
                onChange={(e) =>
                  updateEditForm("status", e.target.value as BookingStatus)
                }
              >
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="paid">Pagada</option>
              </select>
              <input
                className="input"
                type="number"
                min={1}
                value={editForm.customerId}
                onChange={(e) =>
                  updateEditForm("customerId", Number(e.target.value))
                }
                placeholder="Customer ID"
                required
              />
              <input
                className="input"
                type="number"
                min={1}
                value={editForm.businessId}
                onChange={(e) =>
                  updateEditForm("businessId", Number(e.target.value))
                }
                placeholder="Business ID"
                required
              />
              <input
                className="input input--full"
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

      {/* Modal de confirmación de borrado.
          Cierra al hacer clic fuera del modal-card (comprobando e.target === e.currentTarget).
          aria-modal + aria-labelledby + aria-describedby para accesibilidad con lectores de pantalla. */}
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
              Eliminar reserva
            </h3>
            <p id="delete-modal-description" className="modal-text">
              ¿Seguro que quieres eliminar la reserva #{deleteTargetId}? Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={closeDeleteModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={confirmDelete}
                disabled={deletingBookingId === deleteTargetId}
              >
                {deletingBookingId === deleteTargetId ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="section-card booking-table-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Reservas registradas</h3>
          {/* Filtros por estado: cada pill activa/desactiva el filtro del useMemo */}
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

        {/* Mensajes de éxito y error globales de la sección de tabla */}
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
                <th>Customer</th>
                <th>Business</th>
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
                  <td>{booking.customerId}</td>
                  <td>{booking.businessId}</td>
                  <td><StatusBadge status={booking.status} /></td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => openEditForm(booking)}
                      >
                        Editar
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}