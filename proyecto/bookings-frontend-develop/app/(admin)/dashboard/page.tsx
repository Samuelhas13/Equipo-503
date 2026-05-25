"use client";

// [NUEVO] Importamos useEffect para disparar la llamada a la API cuando el dashboard se monte
import { useState, useEffect } from "react";

type DashboardBookingStatus = "pending" | "confirmed" | "paid";

type DashboardBooking = {
  time: string;
  client: string;
  business: string;
  service: string;
  status: DashboardBookingStatus;
};

function Badge({ status }: { status: DashboardBookingStatus }) {
  const label = status === "pending" ? "Pendiente" : status === "confirmed" ? "Confirmada" : "Pagada";
  return <span className={`badge badge--${status}`}>{label}</span>;
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

export default function DashboardPage() {
  // [NUEVO] Estado dinámico para almacenar las reservas reales que vendrán desde SQLite a través de la API
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);

  // [NUEVO] Estado de carga para dar feedback al usuario mientras los datos están en camino
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Estado para controlar si mostramos todas o solo una vista previa
  const [showAll, setShowAll] = useState(false);

  // [NUEVO] Conexión directa a la API. Se ejecuta automáticamente al renderizar el componente por primera vez
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Hacemos la petición a la ruta interna de Next.js conectada a SQLite
        // Cambia la línea 46 de tu archivo del Dashboard por esto:
        // (Asegúrate de poner el puerto correcto en el que corra tu NestJS, ej: 3000 o 3001)
        const response = await fetch("http://localhost:3000/appointments");
        if (!response.ok) throw new Error("Error en la respuesta del servidor");

        const data: DashboardBooking[] = await response.json();
        // Guardamos los datos recibidos en nuestro estado
        setBookings(data);
      } catch (error) {
        console.error("Error conectando a la API de SQLite:", error);
      } finally {
        // Finalizamos el estado de carga tanto si fue exitoso como si falló
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // 2. Si showAll es falso, cortamos el array para mostrar solo las 2 primeras
  // [NUEVO] Ahora apunta dinámicamente a 'bookings' (vienen de la API) en lugar del antiguo array estático
  const displayedBookings = showAll ? bookings : bookings.slice(0, 2);

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Dashboard overview</h2>
          <p>Control diario de reservas, actividad y pagos.</p>
        </div>
        <button className="primary-btn" type="button">Export report</button>
      </section>

      <section className="kpi-grid">
        <KpiCard title="Reservas hoy" value="24" subtitle="+5 respecto a ayer" variant="positive" />
        <KpiCard title="Cobrado hoy" value="820 €" subtitle="18 pagos registrados" />
        <KpiCard title="Pendientes" value="6" subtitle="Seguimiento necesario" variant="warning" />
        <KpiCard title="Clientes activos" value="214" subtitle="Este mes" />
      </section>

      <section className="dashboard-prueba-lg dashboard-prueba-responsive">
        <div className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Próximas reservas</h3>

            {/* 3. Cambiamos el comportamiento del botón y el texto dinámicamente */}
            <button
              className="panel-subtle-link"
              type="button"
              onClick={() => setShowAll(!showAll)}
              disabled={loading} // [NUEVO] Deshabilitamos el botón si los datos aún no se han cargado
            >
              {showAll ? "Ver menos" : "Ver todas"}
            </button>
          </div>

          <div className="table-responsive">
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
                {/* [NUEVO] Renderizado condicional basado en el estado de la conexión de la API */}
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                      Buscando nuevas reservas en SQLite...
                    </td>
                  </tr>
                ) : displayedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                      No se encontraron reservas disponibles.
                    </td>
                  </tr>
                ) : (
                  /* 4. Mapeamos la variable filtrada en lugar del array estático */
                  displayedBookings.map((booking, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 600 }}>{booking.time}</td>
                      <td>{booking.client}</td>
                      <td>{booking.business}</td>
                      <td>{booking.service}</td>
                      <td>
                        <Badge status={booking.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="info-stack dashboard-cartas-lg">
          <div className="info-box">
            <p className="info-box__eyebrow">Siguiente reserva</p>
            {/* [NUEVO] El bloque ahora lee dinámicamente el primer registro devuelto por SQLite */}
            <p className="info-box__title">
              {bookings[0]?.client || "Sin reservas"}
            </p>
            <p className="info-box__text">
              {bookings[0] ? `${bookings[0].time} · ${bookings[0].business}` : "No hay actividad programada"}
            </p>
          </div>
          <div className="info-box">
            <p className="info-box__eyebrow">Comercio destacado</p>
            <p className="info-box__title">Restaurante Marea</p>
            <p className="info-box__text">6 reservas hoy</p>
          </div>
          <div className="info-box">
            <p className="info-box__eyebrow">Recordatorios</p>
            <p className="info-box__title">4 confirmaciones pendientes</p>
            <p className="info-box__text">Revisión recomendada esta mañana</p>
          </div>
        </div>
      </section>
    </div>
  );
}