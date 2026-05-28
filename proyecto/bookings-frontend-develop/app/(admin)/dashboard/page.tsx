"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getAppointments,
  getExportReportUrl,
  type Booking,
  type BookingStatus,
} from "@/lib/api";

type DashboardBookingStatus = "pending" | "confirmed" | "paid" | "canceled" | "completed";

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

const KPI_COLORS: Record<string, KpiCardColor> = {
  teal: { bar: "#1D9E75", trendBg: "#E1F5EE", trendText: "#085041" },
  blue: { bar: "#378ADD", trendBg: "#E6F1FB", trendText: "#042C53" },
  amber: { bar: "#EF9F27", trendBg: "#FAEEDA", trendText: "#412402" },
  purple: { bar: "#7F77DD", trendBg: "#EEEDFE", trendText: "#26215C" },
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

// ─── SUB-COMPONENTE: BUSINESS CALENDAR (Sincronizado con el tema global) ───
// 1. Nos aseguramos de que la interfaz esté declarada e incluya el tipo correcto
interface BusinessCalendarProps {
  bookings: Booking[];
}

// 2. El sub-componente ahora reconocerá perfectamente las propiedades (props)
function BusinessCalendar({ bookings }: BusinessCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  const daysInMonth = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const cells: (number | null)[] = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      cells.push(day);
    }
    return cells;
  }, [year, month]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const bookingsByDateMap = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    return map;
  }, [bookings]);

  return (
    <div className="business-calendar">
      <div className="calendar-header">
        <h3>{monthNames[month]} {year}</h3>
        
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={handlePrevMonth} className="calendar-nav-btn" type="button">◀</button>
          <button onClick={handleNextMonth} className="calendar-nav-btn" type="button">▶</button>
        </div>
      </div>

      <div className="calendar-grid">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div key={d} className="calendar-day-name">{d}</div>
        ))}

        {daysInMonth.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="calendar-cell calendar-cell--empty" />;
          }

          const dayString = String(day).padStart(2, "0");
          const monthString = String(month + 1).padStart(2, "0");
          const isoKey = `${year}-${monthString}-${dayString}`;
          
          const dayBookings = bookingsByDateMap[isoKey] || [];
          const isToday = isoKey === getTodayISO();

          return (
            <div key={isoKey} className={`calendar-cell ${isToday ? "calendar-cell--today" : ""}`}>
              <span className="calendar-date-number">{day}</span>
              <div className="calendar-events-container">
                {dayBookings.sort((a, b) => a.time.localeCompare(b.time)).map((b) => (
                  <div 
                    key={b.id} 
                    className={`calendar-event-pill event-status--${b.status}`}
                    title={`[${b.time}] Servicio: ${b.serviceName}`}
                  >
                    {b.time} - {b.serviceName}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── COMPONENTE RAÍZ PRINCIPAL ───────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [showAll, setShowAll] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NUEVO ESTADO: Controla si la empresa visualiza el "predeterminado" (listado de hoy) o el "calendario"
  const [viewMode, setViewMode] = useState<"default" | "calendar">("default");

  useEffect(() => {
    if (user?.role === "usuario") {
      router.push("/bookings");
    }
  }, [user, router]);

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

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (user?.role === "empresa") {
        return b.businessId === user.businessId;
      }
      return true;
    });
  }, [bookings, user]);

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
        
        {/* MODIFICACIÓN: Contenedor con botones de acción dinámica según el rol y modo */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {user?.role === "empresa" && (
            <button 
              className="secondary-btn" 
              type="button" 
              onClick={() => setViewMode(viewMode === "default" ? "calendar" : "default")}
            >
              {viewMode === "default" ? "📅 Ver Calendario" : "📋 Ver Predeterminado"}
            </button>
          )}
          <button className="primary-btn" type="button" onClick={handleExportReport}>Export report</button>
        </div>
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

      {/* MODIFICACIÓN: Si es una empresa y seleccionó el modo 'calendar', renderizamos el calendario a ancho completo.
        Si está en modo 'default' (o es Admin), se dibuja la distribución predeterminada (Tabla + Info Cards).
      */}
      {user?.role === "empresa" && viewMode === "calendar" ? (
        <section className="section-card" style={{ width: "100%" }}>
          <div className="panel-title-row" style={{ marginBottom: "16px" }}>
            <h3 className="panel-title">Calendario Mensual de Citas</h3>
          </div>
          {loading ? (
            <p className="table-feedback">Cargando agenda...</p>
          ) : error ? (
            <p className="table-feedback table-feedback--error">{error}</p>
          ) : (
            <BusinessCalendar bookings={filteredBookings} />
          )}
        </section>
      ) : (
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
                          <Badge status={booking.status as DashboardBookingStatus} />
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
      )}
    </div>
  );
}