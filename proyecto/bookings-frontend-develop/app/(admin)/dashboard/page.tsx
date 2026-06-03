"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getAppointments, getExportReportUrl } from "@/lib/api";
import type { Booking } from "@/lib/types";

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
  bookings: [40, 55, 35, 70, 60, 80, 75, 90, 65, 85, 70, 95, 80, 100],
  paid: [30, 45, 20, 55, 40, 65, 50, 70, 45, 60, 55, 80, 65, 90],
  pending: [60, 40, 70, 30, 50, 20, 40, 35, 55, 25, 45, 30, 50, 20],
  total: [50, 65, 55, 75, 60, 85, 70, 90, 75, 95, 80, 100, 90, 110],
};

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

// ─── SUB-COMPONENTE: BUSINESS CALENDAR (Sincronizado con el tema global) ───
interface BusinessCalendarProps {
  bookings: Booking[];
  onBookingClick: () => void;
}

function BusinessCalendar({ bookings, onBookingClick }: BusinessCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  /* CAMBIO RESPONSIVE: Añadimos un estado para saber qué día está seleccionado. 
    Por defecto toma el día de hoy en formato ISO (YYYY-MM-DD). Esto permite que
    en pantallas de móvil podamos renderizar la lista detallada abajo al pulsar sobre un día.
  */
  const [selectedDateISO, setSelectedDateISO] = useState<string>(getTodayISO());

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
      const key = bookingDate(b);
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [bookings]);

  /* CAMBIO RESPONSIVE: Memorizamos las citas correspondientes al día seleccionado 
    para pasárselas a la lista del visor inferior táctil en móviles.
  */
  const selectedDayBookings = useMemo(() => {
    const dayList = bookingsByDateMap[selectedDateISO] || [];
    return [...dayList].sort((a, b) => bookingTime(a).localeCompare(bookingTime(b)));
  }, [bookingsByDateMap, selectedDateISO]);

  /* CAMBIO RESPONSIVE: Genera un string legible tipo "28 de mayo" para el encabezado 
    de la lista de citas del día seleccionado en móvil.
  */
  const formattedSelectedDate = useMemo(() => {
    const parts = selectedDateISO.split("-");
    if (parts.length !== 3) return "";
    const [, , dStr] = parts;
    return `${parseInt(dStr, 10)} de ${monthNames[month]}`;
  }, [selectedDateISO, month, monthNames]);

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

          /* CAMBIO RESPONSIVE: Validamos si este día coincide con el seleccionado por el usuario */
          const isSelected = isoKey === selectedDateISO;

          return (
            <div
              key={isoKey}
              /* CAMBIO RESPONSIVE: Guardamos la fecha al hacer click (ideal para interacción táctil) */
              onClick={() => setSelectedDateISO(isoKey)}
              /* CAMBIO RESPONSIVE: Añadimos la clase condicional 'calendar-cell--selected' */
              className={`calendar-cell ${isToday ? "calendar-cell--today" : ""} ${isSelected ? "calendar-cell--selected" : ""}`}
            >
              <span className="calendar-date-number">{day}</span>
              <div className="calendar-events-container">
                {dayBookings.sort((a, b) => bookingTime(a).localeCompare(bookingTime(b))).map((b) => (
                  <div
                    key={b.id}
                    className={`calendar-event-pill event-status--${bookingStatus(b)}`}
                    title={`[${bookingTime(b)}] Servicio: ${bookingServiceName(b)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookingClick();
                    }}
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

      {/* CAMBIO RESPONSIVE: Añadimos este bloque contenedor de la lista inferior. 
        Por CSS (media queries que implementamos previamente) estará oculto en desktop y 
        se mostrará sólo en móviles, haciendo el flujo del dashboard ultra utilizable.
      */}
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

// ─── COMPONENTE RAÍZ PRINCIPAL ───────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();

  // Obtenemos el idioma global para traducir los textos del dashboard
  const { language } = useLanguage();

  // Textos del dashboard en español e inglés
  const texts = {
    es: {
      title: "Resumen del panel",
      subtitle: "Control diario de reservas, actividad y pagos.",
      exportReport: "Exportar informe",
      todayBookings: "Reservas hoy",
      paidToday: "Pagadas hoy",
      pending: "Pendientes",
      totalBookings: "Total reservas",
      confirmed: "confirmadas",
      totalToday: "reservas totales hoy",
      confirmedTotal: "confirmadas en total",
      scheduledToday: "programadas hoy",
      upcomingBookings: "Próximas reservas",
      seeAll: "Ver todas",
      seeLess: "Ver menos",
      loadingBookings: "Cargando reservas...",
      noBookingsToday: "No hay reservas para hoy.",
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
      totalToday: "total bookings today",
      confirmedTotal: "confirmed in total",
      scheduledToday: "scheduled today",
      upcomingBookings: "Upcoming bookings",
      seeAll: "See all",
      seeLess: "See less",
      loadingBookings: "Loading bookings...",
      noBookingsToday: "No bookings for today.",
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
  };

  // 1. Estado para controlar si mostramos todas o solo una vista previa
  const [showAll, setShowAll] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"default" | "calendar">("default");

  // No redirigimos a /bookings en Dashboard: el panel debe mostrar datos para cualquier rol.
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
        return bookingBusinessId(b) === user.businessId;
      }
      return true;
    });
  }, [bookings, user]);

  const today = getTodayISO();
  const todayBookings = filteredBookings.filter((b) => bookingDate(b) === today);
  const pendingBookings = filteredBookings.filter((b) => bookingStatus(b) === "pending");
  const paidBookings = filteredBookings.filter((b) => bookingStatus(b) === "paid");

  // Mostramos las próximas reservas basadas en la misma fuente de datos que BookingsClient.
  // Esto incluye reservas futuras y de hoy, ordenadas por fecha y hora.
  const upcomingBookings = useMemo(() => {
    return [...filteredBookings]
      .filter((b) => bookingDate(b) >= today)
      .sort((a, b) => {
        const dateCompare = bookingDate(a).localeCompare(bookingDate(b));
        return dateCompare !== 0
          ? dateCompare
          : bookingTime(a).localeCompare(bookingTime(b));
      });
  }, [filteredBookings, today]);

  const nextBooking = upcomingBookings[0];
  const displayedBookings = showAll ? upcomingBookings : upcomingBookings.slice(0, 4);

  const handleExportReport = () => {
    window.location.href = getExportReportUrl();
  };

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>{texts[language].title}</h2>
          <p>{texts[language].subtitle}</p>
        </div>
        {/* Contenedor con botones de acción dinámica según el rol y modo */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {user?.role === "empresa" && (
            <button
              className="secondary-btn"
              type="button"
              onClick={() => setViewMode(viewMode === "default" ? "calendar" : "default")}
            >
              {viewMode === "default" ? texts[language].viewCalendar : texts[language].viewDefault}
            </button>
          )}
          <button className="primary-btn" type="button" onClick={handleExportReport}>
            {texts[language].exportReport}
          </button>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard
          title={texts[language].todayBookings}
          value={todayBookings.length}
          trend={`${todayBookings.filter((b) => bookingStatus(b) === "confirmed").length} ${texts[language].confirmed}`}
          color={KPI_COLORS.teal}
          activity={ACTIVITY_DATA.bookings}
          loading={loading}
        />
        <KpiCard
          title={texts[language].paidToday}
          value={paidBookings.filter((b) => bookingDate(b) === today).length}
          trend={`de ${todayBookings.length} ${texts[language].todayBookings.toLowerCase()}`}
          color={KPI_COLORS.blue}
          activity={ACTIVITY_DATA.paid}
          loading={loading}
        />
        <KpiCard
          title={texts[language].pending}
          value={pendingBookings.length}
          trend={texts[language].pendingConfirmations}
          color={KPI_COLORS.amber}
          activity={ACTIVITY_DATA.pending}
          loading={loading}
        />
        <KpiCard
          title={texts[language].totalBookings}
          value={filteredBookings.length}
          trend={`${todayBookings.length} ${texts[language].todayBookings.toLowerCase()}`}
          color={KPI_COLORS.purple}
          activity={ACTIVITY_DATA.total}
          loading={loading}
        />
      </section>
      {/* Si es una empresa y seleccionó el modo 'calendar', renderizamos el calendario a ancho completo.
          Si está en modo 'default' (o es Admin), se dibuja la distribución predeterminada (Tabla + Info Cards). */}
      {user?.role === "empresa" && viewMode === "calendar" ? (
        <section className="section-card" style={{ width: "100%" }}>
          <div className="panel-title-row" style={{ marginBottom: "16px" }}>
            <h3 className="panel-title">{texts[language].monthlyCalendar}</h3>
          </div>
          {loading ? (
            <p className="table-feedback">{texts[language].loadingAgenda}</p>
          ) : error ? (
            <p className="table-feedback table-feedback--error">{error}</p>
          ) : (
            <BusinessCalendar
              bookings={filteredBookings}
              onBookingClick={() => {
                /* No redirigimos desde el calendario del dashboard para mantener el flujo en la misma página. */
              }}
            />
          )}
        </section>
      ) : (
        <section className="dashboard-prueba-lg dashboard-prueba-responsive">
          <div className="section-card">
            <div className="panel-title-row">
              <h3 className="panel-title">{texts[language].upcomingBookings}</h3>
              <button
                className="panel-subtle-link"
                type="button"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? texts[language].seeLess : texts[language].seeAll}
              </button>
            </div>

            <div className="table-responsive-mobile">
              {loading && <p className="table-feedback">{texts[language].loadingBookings}</p>}
              {!loading && error && <p className="table-feedback table-feedback--error">{error}</p>}
              {!loading && !error && upcomingBookings.length === 0 && (
                <p className="table-feedback">{texts[language].noUpcomingBookings}</p>
              )}

              {!loading && !error && upcomingBookings.length > 0 && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{texts[language].time}</th>
                      <th>{texts[language].customer}</th>
                      <th>{texts[language].business}</th>
                      <th>{texts[language].service}</th>
                      <th>{texts[language].status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td style={{ fontWeight: 500 }}>{bookingTime(booking)}</td>
                        <td>#{bookingCustomerId(booking) ?? "?"}</td>
                        <td>#{bookingBusinessId(booking) ?? "?"}</td>
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

          <div className="info-stack dashboard-cartas-lg">
            <div className="info-box">
              <p className="info-box__eyebrow">{texts[language].nextBooking}</p>
              {nextBooking ? (
                <>
                  <p className="info-box__title">
                    {texts[language].customer} #{bookingCustomerId(nextBooking) ?? "?"}
                  </p>
                  <p className="info-box__text">{bookingTime(nextBooking)} · {bookingServiceName(nextBooking)}</p>
                </>
              ) : (
                <p className="info-box__text">{texts[language].noBookings}</p>
              )}
            </div>
            <div className="info-box">
              <p className="info-box__eyebrow">
                {user?.role === "empresa"
                  ? texts[language].myBusiness
                  : texts[language].featuredBusiness}
              </p>
              <p className="info-box__title">
                {user?.role === "empresa"
                  ? user.name ?? user.email ?? texts[language].business
                  : "Restaurante Marea"}
              </p>
              <p className="info-box__text">
                {user?.role === "empresa"
                  ? `${todayBookings.length} ${texts[language].todayBookings.toLowerCase()}`
                  : `6 ${texts[language].todayBookings.toLowerCase()}`}
              </p>
            </div>
            <div className="info-box">
              <p className="info-box__eyebrow">{texts[language].reminders}</p>
              <p className="info-box__title">
                {pendingBookings.length} {texts[language].pendingConfirmations}
              </p>
              <p className="info-box__text">{texts[language].recommendedReview}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// Helpers para normalizar campos de Booking (backend usa `hora_reserva`, `service`, `customer`, `business`)
function bookingDate(b: Booking): string {
  // Formato backend nuevo: campo "date" directo
  if ((b as any).date) return (b as any).date;
  // Formato antiguo: "hora_reserva" = "2026-06-03 14:30"
  const raw = (b as any).hora_reserva || "";
  const parts = raw.split(" ");
  return parts[0]?.includes("-") ? parts[0] : getTodayISO();
}

function bookingTime(b: Booking): string {
  // Formato backend nuevo: campo "time" directo
  if ((b as any).time) return (b as any).time;
  // Formato antiguo
  const raw = (b as any).hora_reserva || "";
  const parts = raw.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : raw;
}

function bookingServiceName(b: Booking): string {
  const svc = (b as any).service;
  if (!svc) return String((b as any).serviceId || "");
  return typeof svc === "object" ? svc.nombre || String(svc.id) : String(svc);
}

function bookingCustomerId(b: Booking): number | undefined {
  const c = (b as any).customer;
  return typeof c === "number" ? c : c?.id;
}

function bookingBusinessId(b: Booking): number | undefined {
  const c = (b as any).business;
  return typeof c === "number" ? c : c?.id;
}

function bookingStatus(b: Booking): string {
  return (b as any).status || "pending";
}