"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
// Importamos la función y los tipos desde la capa de API
import {
  getAppointments,
  getExportReportUrl,
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
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || !barsRef.current) return;

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
  }, [activity, loading]);

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
          {loading ? "—" : trend}
        </span>
      </div>

      <p className="kpi-card__label">{title}</p>
      <p className="kpi-card__value">{loading ? "—" : value}</p>

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

const ACTIVITY_DATA = {
  bookings:  [40, 55, 35, 70, 60, 80, 75, 90, 65, 85, 70, 95, 80, 100],
  paid:      [30, 45, 20, 55, 40, 65, 50, 70, 45, 60, 55, 80, 65, 90],
  pending:   [60, 40, 70, 30, 50, 20, 40, 35, 55, 25, 45, 30, 50, 20],
  total:     [50, 65, 55, 75, 60, 85, 70, 90, 75, 95, 80, 100, 90, 110],
};

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [showAll, setShowAll] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard: redirect usuario to /bookings
  useEffect(() => {
    if (user?.role === "usuario") {
      router.push("/bookings");
    }
  }, [user, router]);

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

  // Filter bookings based on role
  const filteredBookings = bookings.filter((b) => {
    if (user?.role === "empresa") {
      return b.businessId === user.businessId;
    }
    return true;
  });

  // KPIs derivados de los datos reales filtrados
  const today = getTodayISO();
  const todayBookings = filteredBookings.filter((b) => b.date === today);
  const pendingBookings = filteredBookings.filter((b) => b.status === "pending");
  const paidBookings = filteredBookings.filter((b) => b.status === "paid");

  const nextBooking = [...todayBookings].sort((a, b) =>
    a.time.localeCompare(b.time)
  )[0];

  const displayedBookings = showAll ? todayBookings : todayBookings.slice(0, 2);

  const handleExportReport = () => {
    window.location.href = getExportReportUrl();
  };

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Dashboard overview</h2>
          <p>Control diario de reservas, actividad y pagos.</p>
        </div>
        <button className="primary-btn" type="button" onClick={handleExportReport}>Export report</button>
      </section>

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
          value={filteredBookings.length}
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

            <button
              className="panel-subtle-link"
              type="button"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Ver menos" : "Ver todas"}
            </button>
          </div>

          <div className="table-responsive">
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
            <p className="info-box__eyebrow">{user?.role === "empresa" ? "Mi Comercio" : "Comercio destacado"}</p>
            <p className="info-box__title">{user?.role === "empresa" ? user.name : "Restaurante Marea"}</p>
            <p className="info-box__text">{user?.role === "empresa" ? `${todayBookings.length} reservas hoy` : "6 reservas hoy"}</p>
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