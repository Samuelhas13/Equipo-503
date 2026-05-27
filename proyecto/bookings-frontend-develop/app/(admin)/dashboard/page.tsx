"use client";

import { useState, useEffect, useRef } from "react";
// Importamos la función y los tipos desde la capa de API
import {
  getAppointments,
  type Booking,
  type BookingStatus,
} from "@/lib/api";

// MODIFICADO: DashboardBookingStatus ahora incluye todos los estados posibles del backend.
// Antes solo tenía "pending" | "confirmed" | "paid", lo que causaba errores de tipo
// cuando el backend devolvía "canceled" o "completed".
type DashboardBookingStatus = "pending" | "confirmed" | "paid" | "canceled" | "completed";

type DashboardBooking = {
  time: string;
  client: string;
  business: string;
  service: string;
  status: DashboardBookingStatus;
};

// allBookings ya no se usa, los datos vienen de la API. Se mantiene el tipo por compatibilidad
const allBookings: DashboardBooking[] = [
  { time: "09:00", client: "María López", business: "Peluquería Nova", service: "Corte + peinado", status: "confirmed" },
  { time: "10:30", client: "Carlos Pérez", business: "Restaurante Marea", service: "Reserva para 4", status: "pending" },
  { time: "12:00", client: "Lucía Sánchez", business: "Barber Studio", service: "Corte caballero", status: "paid" },
  { time: "14:00", client: "Alejandro Ruiz", business: "Gimnasio Fit", service: "Entrenamiento", status: "confirmed" },
  { time: "16:30", client: "Ana Gómez", business: "Clínica Dental", service: "Revisión", status: "pending" },
];

// MODIFICADO: Badge ahora cubre todos los estados del backend usando un map tipado.
// Antes usaba un ternario encadenado que dejaba fuera "canceled" y "completed",
// causando que TypeScript lanzara un error de tipos al recibir esos valores.
function Badge({ status }: { status: DashboardBookingStatus }) {
  const map: Record<DashboardBookingStatus, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    paid: "Pagada",
    canceled: "Cancelada",
    completed: "Completada",
  };
  return <span className={`badge badge--${status}`}>{map[status] ?? status}</span>;
}

// ─── KpiCard — Variante D ──────────────────────────────────────────────────────
// NUEVO: Componente KpiCard rediseñado con la Variante D.
// Estructura visual:
//   - Borde izquierdo de color como indicador de categoría (sin border-radius).
//   - Cabecera: badge de tendencia alineado a la derecha.
//   - Valor numérico grande con label encima.
//   - Mini histograma de barras en la parte inferior que anima al montar el componente,
//     mostrando la actividad de los últimos N periodos con opacidad variable según magnitud.
//
// Props:
//   - title: texto del label superior
//   - value: número o string principal (muestra "—" si loading=true)
//   - trend: texto corto del badge de tendencia (ej. "+3 hoy", "50%")
//   - color: objeto con las variantes de color para icono, fondo, borde y texto
//   - activity: array de números para el histograma (últimos periodos, de izquierda a derecha)
//   - loading: si true, muestra "—" en el valor y no anima las barras
//
// Posibles mejoras futuras:
//   - Hacer el histograma clickable para navegar al detalle del periodo.
//   - Añadir tooltip al hover de cada barra con el valor exacto.
//   - Permitir pasar una unidad (€, %, uds.) para formatear el valor principal.

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
  loading?: boolean;
}

function KpiCard({
  title,
  value,
  trend,
  color,
  activity,
  loading = false,
}: KpiCardProps) {
  // Referencia al contenedor de barras para manipular el DOM directamente.
  // Usamos DOM imperativo en lugar de state para las alturas porque son
  // animaciones de entrada que solo ocurren una vez al montar el componente.
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // No animamos si está cargando o si el ref no está listo
    if (loading || !barsRef.current) return;

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
        const opacity = v === max ? 1 : v > max * 0.7 ? 0.65 : 0.3;
        bar.style.height = `${heightPx}px`;
        bar.style.opacity = String(opacity);
      });
    }, 150);
  }, [activity, loading]);

  return (
    <div className="kpi-card kpi-card--variant-d">
      {/* Borde lateral izquierdo como indicador de categoría.
          No tiene border-radius porque solo está presente en un lado. */}
      <div
        className="kpi-card__accent"
        style={{ background: color.bar }}
        aria-hidden="true"
      />

      {/* Cabecera: badge de tendencia alineado a la derecha */}
      <div className="kpi-card__head" style={{ justifyContent: "flex-end" }}>
        <span
          className="kpi-card__trend-badge"
          style={{ background: color.trendBg, color: color.trendText }}
        >
          {loading ? "—" : trend}
        </span>
      </div>

      {/* Cuerpo: label + valor principal */}
      <p className="kpi-card__label">{title}</p>
      <p className="kpi-card__value">{loading ? "—" : value}</p>

      {/* Mini histograma de actividad reciente.
          Las barras se renderizan en su estado inicial (4px) y se animan
          en el useEffect de arriba una vez que los datos están disponibles. */}
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

// ─── Configuración de las tarjetas KPI ────────────────────────────────────────
// NUEVO: Extraemos la configuración visual de cada KpiCard a un objeto tipado.
// Esto separa los datos de presentación de la lógica de negocio del componente,
// facilitando añadir o cambiar tarjetas sin tocar el JSX del return principal.
//
// Paleta utilizada (sincronizada con los ramps del design system):
//   - Teal    (#1D9E75 / #E1F5EE / #085041) → Reservas hoy (positivo, activo)
//   - Blue    (#378ADD / #E6F1FB / #042C53) → Pagadas hoy  (informativo)
//   - Amber   (#EF9F27 / #FAEEDA / #412402) → Pendientes   (advertencia)
//   - Purple  (#7F77DD / #EEEDFE / #26215C) → Total        (neutro/resumen)

const KPI_COLORS: Record<string, KpiCardColor> = {
  teal: {
    bar: "#1D9E75",
    trendBg: "#E1F5EE",
    trendText: "#085041",
  },
  blue: {
    bar: "#378ADD",
    trendBg: "#E6F1FB",
    trendText: "#042C53",
  },
  amber: {
    bar: "#EF9F27",
    trendBg: "#FAEEDA",
    trendText: "#412402",
  },
  purple: {
    bar: "#7F77DD",
    trendBg: "#EEEDFE",
    trendText: "#26215C",
  },
};

// Datos de actividad simulados para el histograma de cada KPI.
// En una versión futura estos podrían venir del backend como series temporales
// (ej. endpoint GET /appointments/stats?range=14d).
const ACTIVITY_DATA = {
  bookings:  [40, 55, 35, 70, 60, 80, 75, 90, 65, 85, 70, 95, 80, 100],
  paid:      [30, 45, 20, 55, 40, 65, 50, 70, 45, 60, 55, 80, 65, 90],
  pending:   [60, 40, 70, 30, 50, 20, 40, 35, 55, 25, 45, 30, 50, 20],
  total:     [50, 65, 55, 75, 60, 85, 70, 90, 75, 95, 80, 100, 90, 110],
};

// helper para obtener la fecha de hoy en formato ISO "YYYY-MM-DD"
function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function DashboardPage() {
  // 1. Estado para controlar si mostramos todas o solo una vista previa
  const [showAll, setShowAll] = useState(false);

  // Estado para los datos reales, carga y error
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch al montar el componente
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAppointments();
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // KPIs derivados de los datos reales
  const today = getTodayISO();
  const todayBookings = bookings.filter((b) => b.date === today);
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const paidBookings = bookings.filter((b) => b.status === "paid");

  // Siguiente reserva del día, ordenada por hora
  const nextBooking = [...todayBookings].sort((a, b) =>
    a.time.localeCompare(b.time)
  )[0];

  // Si showAll es falso, cortamos el array para mostrar solo las 2 primeras.
  // Usamos todayBookings en lugar de allBookings
  const displayedBookings = showAll ? todayBookings : todayBookings.slice(0, 2);

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Dashboard overview</h2>
          <p>Control diario de reservas, actividad y pagos.</p>
        </div>
        <button className="primary-btn" type="button">Export report</button>
      </section>

      {/* MODIFICADO: KpiCard rediseñado con Variante D.
          Cada tarjeta recibe su paleta de color y sus datos de
          actividad histórica para el mini histograma inferior.
          Los valores siguen siendo dinámicos y muestran "—" mientras loading=true. */}
      <section className="kpi-grid">
        <KpiCard
          title="Reservas hoy"
          value={todayBookings.length}
          trend={`${todayBookings.filter((b) => b.status === "confirmed").length} confirmadas`}
          color={KPI_COLORS.teal}
          activity={ACTIVITY_DATA.bookings}
          loading={loading}
        />
        <KpiCard
          title="Pagadas hoy"
          value={paidBookings.filter((b) => b.date === today).length}
          trend={`de ${todayBookings.length} hoy`}
          color={KPI_COLORS.blue}
          activity={ACTIVITY_DATA.paid}
          loading={loading}
        />
        <KpiCard
          title="Pendientes"
          value={pendingBookings.length}
          trend="por confirmar"
          color={KPI_COLORS.amber}
          activity={ACTIVITY_DATA.pending}
          loading={loading}
        />
        <KpiCard
          title="Total reservas"
          value={bookings.length}
          trend={`${todayBookings.length} hoy`}
          color={KPI_COLORS.purple}
          activity={ACTIVITY_DATA.total}
          loading={loading}
        />
      </section>

      <section className="dashboard-prueba-lg dashboard-prueba-responsive">
        <div className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Próximas reservas</h3>

            {/* Cambiamos el comportamiento del botón y el texto dinámicamente */}
            <button
              className="panel-subtle-link"
              type="button"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Ver menos" : "Ver todas"}
            </button>
          </div>

          <div className="table-responsive">
            {/* Estados de carga y error antes de renderizar la tabla */}
            {loading && <p className="table-feedback">Cargando reservas...</p>}
            {!loading && error && <p className="table-feedback table-feedback--error">{error}</p>}
            {!loading && !error && todayBookings.length === 0 && (
              <p className="table-feedback">No hay reservas para hoy.</p>
            )}

            {!loading && !error && todayBookings.length > 0 && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Comercio</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Mapeamos la variable filtrada en lugar del array estático */}
                  {/* Usamos los campos de Booking de la API */}
                  {displayedBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td style={{ fontWeight: 600 }}>{booking.time}</td>
                      <td>#{booking.customerId}</td>
                      <td>#{booking.businessId}</td>
                      <td>{booking.serviceName}</td>
                      <td>
                        <Badge status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="info-stack dashboard-cartas-lg">
          {/* Datos dinámicos desde la API */}
          <div className="info-box">
            <p className="info-box__eyebrow">Siguiente reserva</p>
            {nextBooking ? (
              <>
                <p className="info-box__title">Cliente #{nextBooking.customerId}</p>
                <p className="info-box__text">{nextBooking.time} · {nextBooking.serviceName}</p>
              </>
            ) : (
              <p className="info-box__text">Sin reservas hoy</p>
            )}
          </div>
          <div className="info-box">
            <p className="info-box__eyebrow">Comercio destacado</p>
            <p className="info-box__title">Restaurante Marea</p>
            <p className="info-box__text">6 reservas hoy</p>
          </div>
          <div className="info-box">
            <p className="info-box__eyebrow">Recordatorios</p>
            <p className="info-box__title">{pendingBookings.length} confirmaciones pendientes</p>
            <p className="info-box__text">Revisión recomendada esta mañana</p>
          </div>
        </div>
      </section>
    </div>
  );
}