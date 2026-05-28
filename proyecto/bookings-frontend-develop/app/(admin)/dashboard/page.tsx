"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  getAppointments,
  getExportReportUrl,
  type Booking,
  type BookingStatus,
} from "@/lib/api";

type DashboardBookingStatus = "pending" | "confirmed" | "paid" | "canceled" | "completed";

type DashboardBooking = {
  time: string;
  client: string;
  business: string;
  service: string;
  status: DashboardBookingStatus;
};

// Imaginemos que aquí tienes una lista larga de reservas simuladas
// NUEVO: allBookings ya no se usa, los datos vienen de la API. Se mantiene el tipo por compatibilidad
const allBookings: DashboardBooking[] = [
  { time: "09:00", client: "María López", business: "Peluquería Nova", service: "Corte + peinado", status: "confirmed" },
  { time: "10:30", client: "Carlos Pérez", business: "Restaurante Marea", service: "Reserva para 4", status: "pending" },
  { time: "12:00", client: "Lucía Sánchez", business: "Barber Studio", service: "Corte caballero", status: "paid" },
  { time: "14:00", client: "Alejandro Ruiz", business: "Gimnasio Fit", service: "Entrenamiento", status: "confirmed" },
  { time: "16:30", client: "Ana Gómez", business: "Clínica Dental", service: "Revisión", status: "pending" },
];

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

function KpiCard({ title, value, subtitle, variant }: { title: string; value: string; subtitle: string; variant?: "positive" | "warning"; }) {
  return (
    <div className="kpi-card">
      <p className="kpi-card__label">{title}</p>
      <h3 className="kpi-card__value">{value}</h3>
      <p className={`kpi-card__meta ${variant === "positive" ? "kpi-card__meta--positive" : variant === "warning" ? "kpi-card__meta--warning" : ""}`}>{subtitle}</p>
    </div>
  );
}

// NUEVO: helper para obtener la fecha de hoy en formato ISO "YYYY-MM-DD"
function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

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
  },
};

  // 1. Estado para controlar si mostramos todas o solo una vista previa
  const [showAll, setShowAll] = useState(false);

  // NUEVO: estado para los datos reales, carga y error
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard: redirect usuario to /bookings
  useEffect(() => {
    if (user?.role === "usuario") {
      router.push("/bookings");
    }
  }, [user, router]);

  // NUEVO: fetch al montar el componente
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

  // NUEVO: KPIs derivados de los datos reales filtrados
  const today = getTodayISO();
  const todayBookings = filteredBookings.filter((b) => b.date === today);
  const pendingBookings = filteredBookings.filter((b) => b.status === "pending");
  const paidBookings = filteredBookings.filter((b) => b.status === "paid");

  // NUEVO: siguiente reserva del día, ordenada por hora
  const nextBooking = [...todayBookings].sort((a, b) =>
    a.time.localeCompare(b.time)
  )[0];

  // 2. Si showAll es falso, cortamos el array para mostrar solo las 2 primeras
  // NUEVO: ahora usamos todayBookings en lugar de allBookings
  const displayedBookings = showAll ? todayBookings : todayBookings.slice(0, 2);

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
        <button
            className="primary-btn"
            type="button"
            onClick={handleExportReport}
            >
            {texts[language].exportReport}
        </button>
      </section>

     {/* NUEVO: los valores de los KpiCard son dinámicos, con "—" mientras carga */}
      <section className="kpi-grid">
        <KpiCard
            title={texts[language].todayBookings}
            value={loading ? "—" : String(todayBookings.length)}
            subtitle={
              loading
                ? "—"
                : `${todayBookings.filter(b => b.status === "confirmed").length} ${texts[language].confirmed}`
            }
            variant="positive"
          />

          <KpiCard
            title={texts[language].paidToday}
            value={loading ? "—" : String(paidBookings.filter(b => b.date === today).length)}
            subtitle={
              loading
                ? "—"
                : `${todayBookings.length} ${texts[language].totalToday}`
            }
          />

          <KpiCard
            title={texts[language].pending}
            value={loading ? "—" : String(pendingBookings.length)}
            subtitle={
              loading
                ? "—"
                : `${bookings.filter(b => b.status === "confirmed").length} ${texts[language].confirmedTotal}`
            }
            variant="warning"
          />

          <KpiCard
            title={texts[language].totalBookings}
            value={loading ? "—" : String(bookings.length)}
            subtitle={
              loading
                ? "—"
                : `${todayBookings.length} ${texts[language].scheduledToday}`
            }
          />
      </section>

      <section className="dashboard-prueba-lg dashboard-prueba-responsive">
        <div className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">{texts[language].upcomingBookings}</h3>
            
            {/* 3. Cambiamos el comportamiento del botón y el texto dinámicamente */}
            <button 
              className="panel-subtle-link" 
              type="button"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? texts[language].seeLess : texts[language].seeAll}
            </button>
          </div>
          
          <div className="table-responsive">
            {/* NUEVO: estados de carga y error antes de renderizar la tabla */}
            {loading && <p className="table-feedback">{texts[language].loadingBookings}</p>}
            {!loading && error && <p className="table-feedback table-feedback--error">{error}</p>}
            {!loading && !error && todayBookings.length === 0 && (
              <p className="table-feedback">{texts[language].noBookingsToday}</p>
            )}

            {!loading && !error && todayBookings.length > 0 && (
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
                  {/* 4. Mapeamos la variable filtrada en lugar del array estático */}
                  {/* NUEVO: usamos los campos de Booking de la API */}
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
          {/* NUEVO: datos dinámicos desde la API */}
          <div className="info-box">
            <p className="info-box__eyebrow">{texts[language].nextBooking}</p>
            {nextBooking ? (
              <>
                <p className="info-box__title">
                  {texts[language].customer} #{nextBooking.customerId}
                </p>
                <p className="info-box__text">{nextBooking.time} · {nextBooking.serviceName}</p>
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
            <p className="info-box__title">{user?.role === "empresa" ? user.name : "Restaurante Marea"}</p>
           <p className="info-box__text"> {user?.role === "empresa"? `${todayBookings.length} ${texts[language].todayBookings.toLowerCase()}`
           : `6 ${texts[language].todayBookings.toLowerCase()}`}</p>
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
    </div>
  );
}