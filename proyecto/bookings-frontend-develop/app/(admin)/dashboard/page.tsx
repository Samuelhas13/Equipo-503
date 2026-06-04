"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getAppointmentsByRange, getExportReportUrl } from "@/lib/api";
import type { Booking } from "@/lib/types";

type DashboardBookingStatus = "pending" | "confirmed" | "paid" | "canceled" | "completed";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
// Todos los helpers leen primero los campos YA NORMALIZADOS por normalizeBooking()
// en api.ts (date, time, businessId, customerId, serviceName, status).
// Solo como fallback intentan leer los campos raw del backend.

function toNum(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function bookingDate(b: Booking): string {
  // normalizeBooking() ya setea b.date
  if ((b as any).date) return (b as any).date;
  const raw = (b as any).hora_reserva || "";
  return raw.split(" ")[0] || getTodayISO();
}

function bookingTime(b: Booking): string {
  if ((b as any).time) return (b as any).time;
  const raw = (b as any).hora_reserva || "";
  const parts = raw.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : raw;
}

function bookingServiceName(b: Booking): string {
  // normalizeBooking() setea b.serviceName
  if ((b as any).serviceName) return String((b as any).serviceName);
  const svc = (b as any).service;
  if (!svc) return String((b as any).serviceId || "—");
  return typeof svc === "object" ? svc.nombre || String(svc.id) : String(svc);
}

function bookingStatus(b: Booking): string {
  return (b as any).status || "pending";
}

/**
 * FIX PRINCIPAL: Lee primero b.businessId (campo normalizado por api.ts),
 * luego intenta el objeto anidado. Siempre devuelve number | undefined
 * para que la comparación === funcione de forma fiable.
 */
function bookingBusinessId(b: Booking): number | undefined {
  // 1. Campo normalizado por normalizeBooking()
  const direct = toNum((b as any).businessId);
  if (direct !== undefined) return direct;
  // 2. Fallback: objeto anidado del backend
  const nested = (b as any).business;
  if (nested === undefined || nested === null) return undefined;
  return toNum(typeof nested === "object" ? nested.id : nested);
}

function bookingCustomerId(b: Booking): number | undefined {
  const direct = toNum((b as any).customerId);
  if (direct !== undefined) return direct;
  const nested = (b as any).customer;
  if (nested === undefined || nested === null) return undefined;
  return toNum(typeof nested === "object" ? nested.id : nested);
}

// Lee el nombre real del cliente normalizado por normalizeBooking() en api.ts.
// Si no existe, cae al ID como texto de respaldo.
function bookingCustomerName(b: Booking): string {
  // Campo inyectado por normalizeBooking()
  if ((b as any).customerName) return String((b as any).customerName);
  // Fallback: nombre desde el objeto anidado
  const c = (b as any).customer;
  if (c && typeof c === "object") {
    return `${c.nombre || ""} ${c.apellido || ""}`.trim() || c.email || `#${c.id}`;
  }
  const id = bookingCustomerId(b);
  return id !== undefined ? `#${id}` : "?";
}

// Lee el nombre del negocio normalizado por normalizeBooking() en api.ts.
function bookingBusinessName(b: Booking): string {
  if ((b as any).businessName) return String((b as any).businessName);
  const biz = (b as any).business;
  if (biz && typeof biz === "object") return biz.nombre || `#${biz.id}`;
  const id = bookingBusinessId(b);
  return id !== undefined ? `#${id}` : "?";
}

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function getThirtyDaysFromNow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
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

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
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

function KpiCard({ title, value, trend, color, activity, loading = false }: KpiCardProps) {
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
      <div className="kpi-card__accent" style={{ background: color.bar }} aria-hidden="true" />
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
  teal:   { bar: "#1D9E75", trendBg: "#E1F5EE", trendText: "#085041" },
  blue:   { bar: "#378ADD", trendBg: "#E6F1FB", trendText: "#042C53" },
  amber:  { bar: "#EF9F27", trendBg: "#FAEEDA", trendText: "#412402" },
  purple: { bar: "#7F77DD", trendBg: "#EEEDFE", trendText: "#26215C" },
};

const ACTIVITY_DATA = {
  bookings: [40, 55, 35, 70, 60, 80, 75, 90, 65, 85, 70, 95, 80, 100],
  paid:     [30, 45, 20, 55, 40, 65, 50, 70, 45, 60, 55, 80, 65, 90],
  pending:  [60, 40, 70, 30, 50, 20, 40, 35, 55, 25, 45, 30, 50, 20],
  total:    [50, 65, 55, 75, 60, 85, 70, 90, 75, 95, 80, 100, 90, 110],
};

// ─── BUSINESS CALENDAR ───────────────────────────────────────────────────────
interface BusinessCalendarProps {
  bookings: Booking[];
  onBookingClick: () => void;
}

function BusinessCalendar({ bookings, onBookingClick }: BusinessCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateISO, setSelectedDateISO] = useState<string>(getTodayISO());

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre",
  ];

  const daysInMonth = useMemo(() => {
    const firstDayIndex   = new Date(year, month, 1).getDay();
    const adjustedFirst   = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDays       = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < adjustedFirst; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    return cells;
  }, [year, month]);

  const bookingsByDateMap = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      const key = bookingDate(b);
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [bookings]);

  const selectedDayBookings = useMemo(() => {
    return [...(bookingsByDateMap[selectedDateISO] || [])].sort((a, b) =>
      bookingTime(a).localeCompare(bookingTime(b))
    );
  }, [bookingsByDateMap, selectedDateISO]);

  const formattedSelectedDate = useMemo(() => {
    const [, , dStr] = selectedDateISO.split("-");
    return `${parseInt(dStr, 10)} de ${monthNames[month]}`;
  }, [selectedDateISO, month, monthNames]);

  return (
    <div className="business-calendar">
      <div className="calendar-header">
        <h3>{monthNames[month]} {year}</h3>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="calendar-nav-btn" type="button">◀</button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="calendar-nav-btn" type="button">▶</button>
        </div>
      </div>

      <div className="calendar-grid">
        {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => (
          <div key={d} className="calendar-day-name">{d}</div>
        ))}
        {daysInMonth.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="calendar-cell calendar-cell--empty" />;
          }
          const isoKey   = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const dayBooks = bookingsByDateMap[isoKey] || [];
          const isToday  = isoKey === getTodayISO();
          const isSel    = isoKey === selectedDateISO;

          return (
            <div
              key={isoKey}
              onClick={() => setSelectedDateISO(isoKey)}
              className={[
                "calendar-cell",
                isToday ? "calendar-cell--today"    : "",
                isSel   ? "calendar-cell--selected" : "",
              ].join(" ").trim()}
            >
              <span className="calendar-date-number">{day}</span>
              <div className="calendar-events-container">
                {[...dayBooks]
                  .sort((a, b) => bookingTime(a).localeCompare(bookingTime(b)))
                  .map((b) => (
                    <div
                      key={b.id}
                      className={`calendar-event-pill event-status--${bookingStatus(b)}`}
                      title={`[${bookingTime(b)}] ${bookingServiceName(b)}`}
                      onClick={(e) => { e.stopPropagation(); onBookingClick(); }}
                      style={{ cursor: "pointer" }}
                    >
                      {bookingTime(b)} - {bookingServiceName(b)}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lista táctil para móvil */}
      <div className="mobile-active-day-events">
        <h4>Reservas para el {formattedSelectedDate}:</h4>
        {selectedDayBookings.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "var(--cal-text-muted)", margin: 0 }}>
            No hay citas agendadas para este día.
          </p>
        ) : (
          <div className="mobile-event-list">
            {selectedDayBookings.map((b) => (
              <div
                key={b.id}
                className={`mobile-event-item event-status--${bookingStatus(b)}`}
                onClick={onBookingClick}
                style={{ cursor: "pointer" }}
              >
                <strong>{bookingTime(b)}</strong>
                <span>{bookingServiceName(b)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TEXTOS I18N ──────────────────────────────────────────────────────────────
const TEXTS = {
  es: {
    title: "Resumen del panel",
    subtitle: "Control diario de reservas, actividad y pagos.",
    exportReport: "Exportar informe",
    todayBookings: "Reservas hoy",
    paidToday: "Pagadas hoy",
    pending: "Pendientes",
    totalBookings: "Total reservas",
    confirmed: "confirmadas",
    upcomingBookings: "Próximas reservas (30 días)",
    seeAll: "Ver todas",
    seeLess: "Ver menos",
    loadingBookings: "Cargando reservas...",
    noUpcomingBookings: "No hay próximas reservas.",
    time: "Hora",
    customer: "Cliente",
    business: "Comercio",
    service: "Servicio",
    status: "Estado",
    nextBooking: "Siguiente reserva",
    noBookings: "Sin reservas hoy",
    featuredBusiness: "Comercio destacado",
    myBusiness: "Mi Comercio",
    reminders: "Recordatorios",
    pendingConfirmations: "confirmaciones pendientes",
    recommendedReview: "Revisión recomendada esta mañana",
    viewCalendar: "📅 Ver Calendario",
    viewDefault: "📋 Ver Predeterminado",
    monthlyCalendar: "Calendario Mensual de Citas",
    loadingAgenda: "Cargando agenda...",
  },
  en: {
    title: "Dashboard overview",
    subtitle: "Daily control of bookings, activity and payments.",
    exportReport: "Export report",
    todayBookings: "Today bookings",
    paidToday: "Paid today",
    pending: "Pending",
    totalBookings: "Total bookings",
    confirmed: "confirmed",
    upcomingBookings: "Upcoming bookings (30 days)",
    seeAll: "See all",
    seeLess: "See less",
    loadingBookings: "Loading bookings...",
    noUpcomingBookings: "No upcoming bookings.",
    time: "Time",
    customer: "Customer",
    business: "Business",
    service: "Service",
    status: "Status",
    nextBooking: "Next booking",
    noBookings: "No bookings today",
    featuredBusiness: "Featured business",
    myBusiness: "My business",
    reminders: "Reminders",
    pendingConfirmations: "pending confirmations",
    recommendedReview: "Recommended review this morning",
    viewCalendar: "📅 View Calendar",
    viewDefault: "📋 View Default",
    monthlyCalendar: "Monthly Booking Calendar",
    loadingAgenda: "Loading agenda...",
  },
} as const;

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user }     = useAuth();
  const { language } = useLanguage();
  const t            = TEXTS[language as keyof typeof TEXTS] ?? TEXTS.es;

  const [showAll,  setShowAll]  = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"default" | "calendar">("default");

  const rangeFrom = useMemo(() => getTodayISO(),          []);
  const rangeTo   = useMemo(() => getThirtyDaysFromNow(), []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAppointmentsByRange(rangeFrom, rangeTo);
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [rangeFrom, rangeTo]);

  // ── FIX: filtrado robusto por businessId ────────────────────────────────────
  // Convertimos user.businessId a número una sola vez para comparar sin
  // problemas de tipo (string vs number). Si es undefined, no filtramos.
  const filteredBookings = useMemo(() => {
    if (user?.role !== "empresa") return bookings;

    // toNum() devuelve undefined si el valor no es convertible — en ese caso
    // devolvemos todas para no ocultar datos por un problema de configuración.
    const userBizId = toNum((user as any).businessId);

    if (userBizId === undefined) {
      // businessId no está en el objeto user — mostramos todo y avisamos en consola.
      console.warn(
        "[Dashboard] user.businessId es undefined. Revisa AuthContext.",
        user
      );
      return bookings;
    }

    return bookings.filter((b) => bookingBusinessId(b) === userBizId);
  }, [bookings, user]);

  const today         = getTodayISO();
  const todayBookings = filteredBookings.filter((b) => bookingDate(b) === today);
  const pendingBooks  = filteredBookings.filter((b) => bookingStatus(b) === "pending");
  const paidToday     = filteredBookings.filter(
    (b) => bookingStatus(b) === "paid" && bookingDate(b) === today
  );

  const upcomingBookings = useMemo(() =>
    [...filteredBookings]
      .filter((b) => { const d = bookingDate(b); return d >= today && d <= rangeTo; })
      .sort((a, b) => {
        const dc = bookingDate(a).localeCompare(bookingDate(b));
        return dc !== 0 ? dc : bookingTime(a).localeCompare(bookingTime(b));
      }),
    [filteredBookings, today, rangeTo]
  );

  const nextBooking      = upcomingBookings[0];
  const displayedBookings = showAll ? upcomingBookings : upcomingBookings.slice(0, 3);

  return (
    <div className="page-stack">
      {/* ── HERO ── */}
      <section className="page-hero">
        <div>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {user?.role === "empresa" && (
            <button
              className="secondary-btn"
              type="button"
              onClick={() => setViewMode(viewMode === "default" ? "calendar" : "default")}
            >
              {viewMode === "default" ? t.viewCalendar : t.viewDefault}
            </button>
          )}
          <button
            className="primary-btn"
            type="button"
            onClick={() => { window.location.href = getExportReportUrl(); }}
          >
            {t.exportReport}
          </button>
        </div>
      </section>

      {/* ── KPIs ── */}
      <section className="kpi-grid">
        <KpiCard
          title={t.todayBookings}
          value={todayBookings.length}
          trend={`${todayBookings.filter((b) => bookingStatus(b) === "confirmed").length} ${t.confirmed}`}
          color={KPI_COLORS.teal}
          activity={ACTIVITY_DATA.bookings}
          loading={loading}
        />
        <KpiCard
          title={t.paidToday}
          value={paidToday.length}
          trend={`de ${todayBookings.length} ${t.todayBookings.toLowerCase()}`}
          color={KPI_COLORS.blue}
          activity={ACTIVITY_DATA.paid}
          loading={loading}
        />
        <KpiCard
          title={t.pending}
          value={pendingBooks.length}
          trend={t.pendingConfirmations}
          color={KPI_COLORS.amber}
          activity={ACTIVITY_DATA.pending}
          loading={loading}
        />
        <KpiCard
          title={t.totalBookings}
          value={filteredBookings.length}
          trend={`${todayBookings.length} ${t.todayBookings.toLowerCase()}`}
          color={KPI_COLORS.purple}
          activity={ACTIVITY_DATA.total}
          loading={loading}
        />
      </section>

      {/* ── CONTENIDO PRINCIPAL ── */}
      {user?.role === "empresa" && viewMode === "calendar" ? (
        <section className="section-card" style={{ width: "100%" }}>
          <div className="panel-title-row" style={{ marginBottom: "16px" }}>
            <h3 className="panel-title">{t.monthlyCalendar}</h3>
          </div>
          {loading ? (
            <p className="table-feedback">{t.loadingAgenda}</p>
          ) : error ? (
            <p className="table-feedback table-feedback--error">{error}</p>
          ) : (
            <BusinessCalendar bookings={filteredBookings} onBookingClick={() => {}} />
          )}
        </section>
      ) : (
        <section className="dashboard-prueba-lg dashboard-prueba-responsive">
          {/* Tabla de próximas reservas */}
          <div className="section-card">
            <div className="panel-title-row">
              <h3 className="panel-title">{t.upcomingBookings}</h3>
              <button
                className="panel-subtle-link"
                type="button"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? t.seeLess : t.seeAll}
              </button>
            </div>

            <div className="table-responsive-mobile">
              {loading && <p className="table-feedback">{t.loadingBookings}</p>}
              {!loading && error && <p className="table-feedback table-feedback--error">{error}</p>}
              {!loading && !error && upcomingBookings.length === 0 && (
                <p className="table-feedback">{t.noUpcomingBookings}</p>
              )}
              {!loading && !error && upcomingBookings.length > 0 && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t.time}</th>
                      <th>{t.customer}</th>
                      <th>{t.business}</th>
                      <th>{t.service}</th>
                      <th>{t.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td style={{ fontWeight: 500 }}>{bookingTime(booking)}</td>
                        {/* Mostramos nombre real del cliente en lugar del ID */}
                        <td>{bookingCustomerName(booking)}</td>
                        {/* Mostramos nombre real del negocio en lugar del ID */}
                        <td>{bookingBusinessName(booking)}</td>
                        <td>{bookingServiceName(booking)}</td>
                        <td>
                          <Badge status={bookingStatus(booking) as DashboardBookingStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Info cards laterales */}
          <div className="info-stack dashboard-cartas-lg">
            <div className="info-box">
              <p className="info-box__eyebrow">{t.nextBooking}</p>
              {nextBooking ? (
                <>
                  <p className="info-box__title">
                    {/* Nombre real del cliente de la próxima reserva */}
                    {t.customer}: {bookingCustomerName(nextBooking)}
                  </p>
                  <p className="info-box__text">
                    {bookingTime(nextBooking)} · {bookingServiceName(nextBooking)}
                  </p>
                </>
              ) : (
                <p className="info-box__text">{t.noBookings}</p>
              )}
            </div>

            <div className="info-box">
              <p className="info-box__eyebrow">
                {user?.role === "empresa" ? t.myBusiness : t.featuredBusiness}
              </p>
              <p className="info-box__title">
                {user?.role === "empresa"
                  ? (user as any).name ?? (user as any).email ?? t.business
                  : "Restaurante Marea"}
              </p>
              <p className="info-box__text">
                {user?.role === "empresa"
                  ? `${todayBookings.length} ${t.todayBookings.toLowerCase()}`
                  : `6 ${t.todayBookings.toLowerCase()}`}
              </p>
            </div>

            <div className="info-box">
              <p className="info-box__eyebrow">{t.reminders}</p>
              <p className="info-box__title">
                {pendingBooks.length} {t.pendingConfirmations}
              </p>
              <p className="info-box__text">{t.recommendedReview}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}