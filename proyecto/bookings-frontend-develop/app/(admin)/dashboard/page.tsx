/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getAppointments, getExportReportUrl, getDashboardStats } from "@/lib/api";
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
  bookings:  [40, 55, 35, 70, 60, 80, 75, 90, 65, 85, 70, 95, 80, 100],
  paid:      [30, 45, 20, 55, 40, 65, 50, 70, 45, 60, 55, 80, 65, 90],
  pending:   [60, 40, 70, 30, 50, 20, 40, 35, 55, 25, 45, 30, 50, 20],
  total:     [50, 65, 55, 75, 60, 85, 70, 90, 75, 95, 80, 100, 90, 110],
};

function getTodayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const monthNames = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

// ─── SUB-COMPONENTE: BUSINESS CALENDAR (Sincronizado con el tema global) ───
interface BusinessCalendarProps {
  bookings: Booking[];
}

function BusinessCalendar({ bookings }: BusinessCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  /* CAMBIO RESPONSIVE: Añadimos un estado para saber qué día está seleccionado. 
    Por defecto toma el día de hoy en formato ISO (YYYY-MM-DD). Esto permite que
    en pantallas de móvil podamos renderizar la lista detallada abajo al pulsar sobre un día.
  */
  const [selectedDateISO, setSelectedDateISO] = useState<string>(getTodayISO());

  // Estado para controlar el modal de reservas de un día (desktop/responsive)
  const [modalDateISO, setModalDateISO] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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
    const [,, dStr] = parts;
    return `${parseInt(dStr, 10)} de ${monthNames[month]}`;
  }, [selectedDateISO, month]);

  // Lista de citas para el modal del día seleccionado
  const modalBookings = useMemo(() => {
    if (!modalDateISO) return [];
    const dayList = bookingsByDateMap[modalDateISO] || [];
    return [...dayList].sort((a, b) => bookingTime(a).localeCompare(bookingTime(b)));
  }, [bookingsByDateMap, modalDateISO]);

  // Formateador del título del modal
  const formattedModalDate = useMemo(() => {
    if (!modalDateISO) return "";
    const parts = modalDateISO.split("-");
    if (parts.length !== 3) return "";
    const [yStr, mStr, dStr] = parts;
    const mIdx = parseInt(mStr, 10) - 1;
    return `${parseInt(dStr, 10)} de ${monthNames[mIdx]} de ${yStr}`;
  }, [modalDateISO]);

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

          // Limit displayed events on calendar grid to prevent overlap/collapsing (max 3 lines)
          const sortedBookings = [...dayBookings].sort((a, b) => bookingTime(a).localeCompare(bookingTime(b)));
          const maxVisible = 3;
          const displayBookings = sortedBookings.length > maxVisible ? sortedBookings.slice(0, 2) : sortedBookings;
          const remainingCount = sortedBookings.length - displayBookings.length;

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
                {displayBookings.map((b) => (
                  <div 
                    key={b.id} 
                    className={`calendar-event-pill event-status--${bookingStatus(b)}`}
                    title={`[${bookingTime(b)}] Servicio: ${bookingServiceName(b)}`}
                  >
                    {bookingTime(b)} - {bookingServiceName(b)}
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div 
                    className="calendar-more-events"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalDateISO(isoKey);
                    }}
                    title={sortedBookings.slice(2).map(b => `[${bookingTime(b)}] ${bookingServiceName(b)}`).join('\n')}
                  >
                    +{remainingCount} más
                  </div>
                )}
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
              <div key={b.id} className={`mobile-event-item event-status--${bookingStatus(b)}`}>
                <strong>{bookingTime(b)}</strong>
                <span>{bookingServiceName(b)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para mostrar todas las reservas del día seleccionado (Desktop) */}
      {modalDateISO && (
        <div className="calendar-modal-backdrop" onClick={() => setModalDateISO(null)}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h4>Reservas para el {formattedModalDate}</h4>
              <button 
                type="button" 
                className="calendar-modal-close-btn" 
                onClick={() => setModalDateISO(null)}
              >
                &times;
              </button>
            </div>
            <div className="calendar-modal-body">
              {modalBookings.length === 0 ? (
                <p style={{ color: "var(--muted)", textAlign: "center", margin: "20px 0" }}>
                  No hay reservas para este día.
                </p>
              ) : (
                <div className="calendar-modal-list">
                  {modalBookings.map((b) => (
                    <div key={b.id} className="calendar-modal-item">
                      <div className="calendar-modal-item-left">
                        <span className="calendar-modal-item-time">{bookingTime(b)}</span>
                        <span className="calendar-modal-item-service">{bookingServiceName(b)}</span>
                      </div>
                      <Badge status={bookingStatus(b) as DashboardBookingStatus} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SUB-COMPONENTES: GRÁFICOS PERSONALIZADOS ───

function CylinderKpi({
  label,
  value,
  percentage,
  colorStart,
  colorEnd,
  id,
}: {
  label: string;
  value: string | number;
  percentage: number;
  colorStart: string;
  colorEnd: string;
  id: string;
}) {
  const fillHeight = Math.max(0, Math.min(130, 130 * (percentage / 100)));
  const fillY = 150 - fillHeight;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: "60px" }}>
      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "4px", textAlign: "center" }}>
        {label}
      </span>
      <svg width="60" height="150" viewBox="0 0 100 180" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={`cylGrad-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={colorStart} stopOpacity="0.85" />
            <stop offset="50%" stopColor={colorEnd} stopOpacity="0.95" />
            <stop offset="100%" stopColor={colorStart} stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id={`capGrad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorEnd} />
            <stop offset="100%" stopColor={colorStart} />
          </linearGradient>
          <linearGradient id={`cylBg-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--border)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="var(--border)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--border)" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Cylinder Background */}
        <ellipse cx="50" cy="150" rx="30" ry="12" fill="var(--border)" opacity="0.1" />
        <path
          d="M 20,30 A 30,12 0 0,0 80,30 L 80,150 A 30,12 0 0,1 20,150 Z"
          fill={`url(#cylBg-${id})`}
          stroke="var(--border)"
          strokeWidth="0.5"
          opacity="0.6"
        />
        <ellipse cx="50" cy="30" rx="30" ry="12" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="0.5" opacity="0.8" />

        {/* Cylinder Active Fill */}
        {fillHeight > 0 && (
          <>
            <path
              d={`M 20,${fillY} A 30,12 0 0,0 80,${fillY} L 80,150 A 30,12 0 0,1 20,150 Z`}
              fill={`url(#cylGrad-${id})`}
            />
            <ellipse cx="50" cy={fillY} rx="30" ry="12" fill={`url(#capGrad-${id})`} stroke={colorEnd} strokeWidth="0.5" />
          </>
        )}
      </svg>
      <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text)", marginTop: "8px", textAlign: "center" }}>
        {value}
      </span>
    </div>
  );
}

function CylinderKpisChart({ stats }: { stats: { completedPct: number; paidPct: number; confirmedPct: number; pendingPct: number } }) {
  return (
    <div className="section-card" style={{ flex: 1, minWidth: "280px", display: "flex", flexDirection: "column" }}>
      <div className="panel-title-row" style={{ marginBottom: "12px" }}>
        <h3 className="panel-title" style={{ fontSize: "16px", fontWeight: 700 }}>
          Rendimiento de Reservas
        </h3>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flex: 1, gap: "10px", padding: "10px 0" }}>
        <CylinderKpi
          id="com"
          label="Completadas"
          value={`${stats.completedPct}%`}
          percentage={stats.completedPct}
          colorStart="#EF9F27"
          colorEnd="#FCD34D"
        />
        <CylinderKpi
          id="paid"
          label="Pagadas"
          value={`${stats.paidPct}%`}
          percentage={stats.paidPct}
          colorStart="#1D9E75"
          colorEnd="#34D399"
        />
        <CylinderKpi
          id="conf"
          label="Confirmadas"
          value={`${stats.confirmedPct}%`}
          percentage={stats.confirmedPct}
          colorStart="#378ADD"
          colorEnd="#60A5FA"
        />
        <CylinderKpi
          id="pend"
          label="Pendientes"
          value={`${stats.pendingPct}%`}
          percentage={stats.pendingPct}
          colorStart="#7F77DD"
          colorEnd="#A5B4FC"
        />
      </div>
    </div>
  );
}

function RevenueChart({ data }: { data: { day: string; revenue: number; count: number }[] }) {
  const width = 500;
  const height = 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const revenues = data.map((d) => d.revenue);
  const maxRevenue = Math.max(...revenues, 1000);

  const getCoords = () => {
    return data.map((d, i) => {
      const x = paddingLeft + (i / 6) * chartWidth;
      const y = height - paddingBottom - (d.revenue / maxRevenue) * chartHeight;
      return { x, y, ...d };
    });
  };

  const coords = getCoords();

  const linePath = coords.reduce((acc, c, i) => {
    if (i === 0) return `M ${c.x} ${c.y}`;
    const prev = coords[i - 1];
    const cpX1 = prev.x + (c.x - prev.x) / 3;
    const cpY1 = prev.y;
    const cpX2 = prev.x + 2 * (c.x - prev.x) / 3;
    const cpY2 = c.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${c.x} ${c.y}`;
  }, "");

  const areaPath = coords.length > 0
    ? `${linePath} L ${coords[coords.length - 1].x} ${height - paddingBottom} L ${coords[0].x} ${height - paddingBottom} Z`
    : "";

  const formatCurrency = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k€`;
    return `${val}€`;
  };

  return (
    <div className="section-card" style={{ flex: 1, minWidth: "280px" }}>
      <div className="panel-title-row" style={{ marginBottom: "12px" }}>
        <h3 className="panel-title" style={{ fontSize: "16px", fontWeight: 700 }}>
          Historial de Ingresos Semanales
        </h3>
      </div>
      <div style={{ position: "relative", width: "100%", height: `${height}px` }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#378ADD" />
              <stop offset="50%" stopColor="#7F77DD" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + ratio * chartHeight;
            const value = maxRevenue - ratio * maxRevenue;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                  opacity="0.3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--muted)"
                  fontWeight="600"
                >
                  {formatCurrency(value)}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0px 4px 6px rgba(127, 119, 221, 0.3))" }}
            />
          )}

          {coords.map((c, i) => (
            <g key={i} className="chart-point-group" style={{ cursor: "pointer" }}>
              <circle
                cx={c.x}
                cy={c.y}
                r="5"
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth="2.5"
              />
              <circle
                cx={c.x}
                cy={c.y}
                r="10"
                fill="var(--accent)"
                opacity="0"
                className="chart-hover-circle"
                style={{ transition: "opacity 0.2s" }}
              />
              <title>{`${c.day}: ${c.revenue.toLocaleString()}€ (${c.count} reservas)`}</title>
            </g>
          ))}

          {coords.map((c, i) => (
            <text
              key={i}
              x={c.x}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="var(--muted)"
              fontWeight="700"
            >
              {c.day.slice(0, 3)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function PopularServicesChart({ data }: { data: { name: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="section-card" style={{ flex: 1, minWidth: "280px" }}>
      <div className="panel-title-row" style={{ marginBottom: "12px" }}>
        <h3 className="panel-title" style={{ fontSize: "16px", fontWeight: 700 }}>
          Servicios Más Reservados
        </h3>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "4px 0" }}>
        {data.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: "13px", textAlign: "center", margin: "20px 0" }}>
            No hay suficientes datos.
          </p>
        ) : (
          data.map((item, idx) => {
            const percentage = Math.round((item.count / maxCount) * 100);
            const barColors = [
              "linear-gradient(90deg, #378ADD, #7F77DD)",
              "linear-gradient(90deg, #1D9E75, #10B981)",
              "linear-gradient(90deg, #EF9F27, #FCD34D)",
              "linear-gradient(90deg, #7F77DD, #A5B4FC)",
              "linear-gradient(90deg, #EC4899, #F472B6)",
            ];
            const color = barColors[idx % barColors.length];

            return (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent)" }}>
                    {item.count.toLocaleString()}
                  </span>
                </div>
                <div style={{ width: "100%", height: "14px", background: "var(--surface-2)", borderRadius: "7px", overflow: "hidden", position: "relative", border: "1px solid var(--border)" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${percentage}%`,
                      background: color,
                      borderRadius: "6px",
                      transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── COMPONENTE RAÍZ PRINCIPAL ───────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

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
      historicRevenue: "Ingresos históricos",
      weeklyRevenue: "Ingresos semanales",
      activeBusinesses: "Comercios activos",
      estimatedRevenue: "Ingresos estimados",
      paidRevenue: "Ingresos cobrados",
      pendingRevenue: "Ingresos pendientes",
      totalBookingsShort: "Reservas totales",
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
      historicRevenue: "Historic revenue",
      weeklyRevenue: "Weekly revenue",
      activeBusinesses: "Active businesses",
      estimatedRevenue: "Estimated revenue",
      paidRevenue: "Paid revenue",
      pendingRevenue: "Pending revenue",
      totalBookingsShort: "Total bookings",
    },
  };

  // 1. Estado para controlar si mostramos todas o solo una vista previa
  const [showAll, setShowAll] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"default" | "calendar">("default");

  const [calendarBookings, setCalendarBookings] = useState<Booking[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

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
        const [stats, apps] = await Promise.all([
          getDashboardStats(),
          getAppointments(1, 10)
        ]);
        setStatsData(stats);
        setBookings(apps);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (viewMode === "calendar" && calendarBookings.length === 0) {
      async function loadCalendar() {
        try {
          setLoadingCalendar(true);
          const data = await getAppointments();
          setCalendarBookings(data);
        } catch (err) {
          console.error("Error loading calendar bookings", err);
        } finally {
          setLoadingCalendar(false);
        }
      }
      loadCalendar();
    }
  }, [viewMode, calendarBookings]);

  const today = getTodayISO();
  const todayBookings = bookings.filter((b) => bookingDate(b) === today);

  const revenueData = useMemo(() => {
    return statsData?.revenueData || [];
  }, [statsData]);

  const popularServices = useMemo(() => {
    return statsData?.popularServices || [];
  }, [statsData]);

  const stats = useMemo(() => {
    if (statsData?.stats) return statsData.stats;
    return {
      completedPct: 0,
      paidPct: 0,
      confirmedPct: 0,
      pendingPct: 0,
    };
  }, [statsData]);

  // Cómputo de ingresos y totalizadores dinámicos para admin y empresa
  const historicRevenue = statsData?.historicRevenue || 0;
  const weeklyRevenue = statsData?.weeklyRevenue || 0;
  const paidRevenue = statsData?.paidRevenue || 0;
  const pendingRevenue = statsData?.pendingRevenue || 0;
  const activeBusinessesCount = statsData?.activeBusinesses || 0;

  const pendingBookingsCount = useMemo(() => {
    if (!statsData?.totalBookings) return 0;
    return Math.round((stats.pendingPct / 100) * statsData.totalBookings);
  }, [statsData, stats.pendingPct]);

  const nextBooking = useMemo(() => {
    if (bookings.length === 0) return null;
    return bookings[0];
  }, [bookings]);

  const displayedBookings = showAll ? bookings : bookings.slice(0, 5);

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
        {user?.role === "admin" ? (
          <>
            <KpiCard
              title={texts[language].historicRevenue}
              value={`${historicRevenue.toLocaleString()}€`}
              trend={language === "es" ? "acumulado total" : "total accumulated"}
              color={KPI_COLORS.teal}
              activity={ACTIVITY_DATA.paid}
              loading={loading}
            />
            <KpiCard
              title={texts[language].weeklyRevenue}
              value={`${weeklyRevenue.toLocaleString()}€`}
              trend={language === "es" ? "esta semana" : "this week"}
              color={KPI_COLORS.blue}
              activity={ACTIVITY_DATA.total}
              loading={loading}
            />
            <KpiCard
              title={texts[language].totalBookingsShort}
              value={statsData?.totalBookings || 0}
              trend={language === "es" ? "citas registradas" : "registered slots"}
              color={KPI_COLORS.purple}
              activity={ACTIVITY_DATA.bookings}
              loading={loading}
            />
            <KpiCard
              title={texts[language].activeBusinesses}
              value={activeBusinessesCount}
              trend={language === "es" ? "comercios activos" : "active businesses"}
              color={KPI_COLORS.amber}
              activity={ACTIVITY_DATA.pending}
              loading={loading}
            />
          </>
        ) : (
          <>
            <KpiCard
              title={texts[language].estimatedRevenue}
              value={`${historicRevenue.toLocaleString()}€`}
              trend={language === "es" ? "ingresos estimados" : "estimated revenue"}
              color={KPI_COLORS.teal}
              activity={ACTIVITY_DATA.total}
              loading={loading}
            />
            <KpiCard
              title={texts[language].paidRevenue}
              value={`${paidRevenue.toLocaleString()}€`}
              trend={language === "es" ? "ingresos cobrados" : "paid revenue"}
              color={KPI_COLORS.blue}
              activity={ACTIVITY_DATA.paid}
              loading={loading}
            />
            <KpiCard
              title={texts[language].pendingRevenue}
              value={`${pendingRevenue.toLocaleString()}€`}
              trend={language === "es" ? "pendiente de cobro" : "pending collection"}
              color={KPI_COLORS.amber}
              activity={ACTIVITY_DATA.pending}
              loading={loading}
            />
            <KpiCard
              title={texts[language].totalBookingsShort}
              value={statsData?.totalBookings || 0}
              trend={language === "es" ? "reservas de tu negocio" : "your business bookings"}
              color={KPI_COLORS.purple}
              activity={ACTIVITY_DATA.bookings}
              loading={loading}
            />
          </>
        )}
      </section>

      {/* Si es una empresa y seleccionó el modo 'calendar', renderizamos el calendario a ancho completo.
          Si está en modo 'default' (o es Admin), se dibuja la distribución predeterminada (Tabla + Info Cards).
          Ocultamos este bloque para administradores, ya que solo aplica a empresas. */}
      {user?.role !== "admin" && (
        user?.role === "empresa" && viewMode === "calendar" ? (
          <section className="section-card" style={{ width: "100%" }}>
            <div className="panel-title-row" style={{ marginBottom: "16px" }}>
              <h3 className="panel-title">{texts[language].monthlyCalendar}</h3>
            </div>
            {loadingCalendar ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
                <div className="spinner" />
              </div>
            ) : error ? (
              <p className="table-feedback table-feedback--error">{error}</p>
            ) : (
              <BusinessCalendar bookings={calendarBookings} />
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

              <div className="table-responsive">
                {loading && (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <div className="spinner" />
                  </div>
                )}
                {!loading && error && <p className="table-feedback table-feedback--error">{error}</p>}
                {!loading && !error && bookings.length === 0 && (
                  <p className="table-feedback">{language === "es" ? "No hay próximas reservas." : "No upcoming bookings."}</p>
                )}

                {!loading && !error && bookings.length > 0 && (
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
                          <td style={{ fontWeight: 600 }}>{bookingTime(booking)}</td>
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
                  {pendingBookingsCount} {texts[language].pendingConfirmations}
                </p>
                <p className="info-box__text">{texts[language].recommendedReview}</p>
              </div>
            </div>
          </section>
        )
      )}

      {/* ─── GRÁFICOS DE HISTORIAL DE INGRESOS Y RESERVAS ─── */}
      {!loading && !error && (
        <section className="charts-grid">
          <RevenueChart data={revenueData} />
          <PopularServicesChart data={popularServices} />
          <CylinderKpisChart stats={stats} />
        </section>
      )}
    </div>
  );
}

// Helpers para normalizar campos de Booking (backend usa `hora_reserva`, `service`, `customer`, `business`)
function bookingDate(b: Booking): string {
  if (b.date) return b.date;
  const raw = (b as any).hora_reserva || "";
  const parts = raw.split(" ");
  return parts[0]?.includes("-") ? parts[0] : getTodayISO();
}

function bookingTime(b: Booking): string {
  if (b.time) return b.time;
  const raw = (b as any).hora_reserva || "";
  const parts = raw.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : raw;
}

function bookingServiceName(b: Booking): string {
  if (b.serviceName) return b.serviceName;
  const svc = (b as any).service;
  if (!svc) return String((b as any).serviceId || "");
  return typeof svc === "object" ? svc.nombre || String(svc.id) : String(svc);
}

function bookingCustomerId(b: Booking): number | undefined {
  if (typeof b.customerId === "number") return b.customerId;
  const c = (b as any).customer;
  return typeof c === "number" ? c : c?.id;
}

function bookingBusinessId(b: Booking): number | undefined {
  if (typeof b.businessId === "number") return b.businessId;
  const c = (b as any).business;
  return typeof c === "number" ? c : c?.id;
}

function bookingStatus(b: Booking): string {
  return (b as any).status || "pending";
}