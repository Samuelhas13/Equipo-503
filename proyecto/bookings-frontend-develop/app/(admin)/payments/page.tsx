"use client";

// MODIFICADO: Añadido useRef para el histograma de las KpiCard variante D
import { useEffect, useState, useRef } from "react";
// Importamos getPayments de la capa centralizada de API.
// Antes toda la página usaba datos hardcodeados en el array payments[].
import { getPayments } from "@/lib/api";
// Importamos el tipo Payment desde types.ts (fuente única de verdad).
import type { Payment } from "@/lib/types";

// ─── KpiCard — Variante D ──────────────────────────────────────────────────────
// NUEVO: Componente KpiCard rediseñado con la Variante D, consistente con
// dashboard/page.tsx y BookingsClient.tsx.
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
//   - color: objeto con las variantes de color para fondo y texto
//   - activity: array de números para el histograma (últimos periodos)
//   - loading: si true, muestra "—" en el valor y no anima las barras
//
// Posibles mejoras futuras:
//   - Hacer el histograma clickable para navegar al detalle del periodo.
//   - Añadir tooltip al hover de cada barra con el valor exacto.
//   - Permitir pasar una unidad (€, %) para formatear el valor principal.

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
    const bars = container.querySelectorAll(".kpi-d__dot");
    setTimeout(() => {
      bars.forEach((bar, i) => {
        const v = activity[i] ?? 0;
        const heightPx = Math.round((v / max) * 24 + 4);
        // Opacidad variable: máximo=1, alto=0.65, bajo=0.3 (efecto de profundidad visual)
        const opacity = v === max ? 1 : v > max * 0.7 ? 0.65 : 0.3;
        (bar as HTMLElement).style.height = `${heightPx}px`;
        (bar as HTMLElement).style.opacity = String(opacity);
      });
    }, 150);
  }, [activity, loading]);

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
        {/* Badge de tendencia: pastilla pequeña con contexto del valor (ej. "4 operaciones") */}
        <span
          className="kpi-card__trend-badge"
          style={{ background: color.trendBg, color: color.trendText }}
        >
          {loading ? "—" : trend}
        </span>
      </div>

      {/* Cuerpo: label descriptivo + valor numérico principal */}
      <p className="kpi-card__label">{title}</p>
      <p className="kpi-card__value">{loading ? "—" : value}</p>

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
//   - Green  → Cobrado total  (verde positivo, dinero ingresado)
//   - Amber  → Pendiente      (ámbar de alerta, cobros por revisar)
//   - Purple → Total pagos    (púrpura de marca, resumen general)
const KPI_COLORS: Record<string, KpiCardColor> = {
  green: {
    bar:       "#1D9E75",
    trendBg:   "#E1F5EE",
    trendText: "#085041",
  },
  amber: {
    bar:       "#EF9F27",
    trendBg:   "#FAEEDA",
    trendText: "#412402",
  },
  purple: {
    bar:       "#7F77DD",
    trendBg:   "#EEEDFE",
    trendText: "#26215C",
  },
};

// Datos de actividad simulados para el histograma de cada KPI.
// En una versión futura estos podrían venir del backend como series temporales
// (ej. endpoint GET /payments/stats?range=14d).
const ACTIVITY_DATA = {
  paid:    [30, 45, 20, 55, 40, 65, 50, 70, 45, 60, 55, 80, 65, 90],
  pending: [60, 40, 70, 30, 50, 20, 40, 35, 55, 25, 45, 30, 50, 20],
  total:   [50, 65, 55, 75, 60, 85, 70, 90, 75, 95, 80, 100, 90, 110],
};

// ─── Badge ────────────────────────────────────────────────────────────────────
// Muestra el estado del pago con el color correspondiente del design system.
// "paid" usa la clase badge--confirmed (verde) porque indica un cobro cerrado exitoso.
function Badge({ status }: { status: Payment["status"] }) {
  return (
    <span className={`badge badge--${status === "pending" ? "pending" : "confirmed"}`}>
      {status === "pending" ? "Por cobrar" : "Pagado"}
    </span>
  );
}

// ─── PaymentsPage ─────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  // Estado para los pagos reales, carga y errores.
  // Antes la página renderizaba directamente el array estático payments[].
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargamos los pagos desde el backend al montar el componente.
  // Sustituye los datos hardcodeados que había antes en el array payments[].
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getPayments();
        setPayments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // KPIs calculados dinámicamente desde los datos reales del backend.
  // Antes los valores de los KpiCard ("171 €", "80 €", "84%") eran strings estáticos.
  const paid         = payments.filter((p) => p.status === "paid");
  const pending      = payments.filter((p) => p.status === "pending");
  const totalPaid    = paid.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const totalPending = pending.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Payments</h2>
          <p>Seguimiento de cobros realizados y pendientes.</p>
        </div>
        <button className="primary-btn" type="button">Registrar cobro</button>
      </section>

      {/* ── KPIs variante D ──────────────────────────────────────────────────
          MODIFICADO: Reemplazamos los KpiCard estáticos por el componente
          KpiCard con la Variante D: badge de tendencia y mini histograma (sin icono).
          Los valores siguen siendo dinámicos y muestran "—" mientras loading=true. */}
      <section className="kpi-grid">
        {/* Cobrado total — verde */}
        <KpiCard
          title="Cobrado total"
          value={loading ? "—" : `${totalPaid} €`}
          trend={`${paid.length} operaciones`}
          color={KPI_COLORS.green}
          activity={ACTIVITY_DATA.paid}
          loading={loading}
        />

        {/* Pendiente — amber */}
        <KpiCard
          title="Pendiente"
          value={loading ? "—" : `${totalPending} €`}
          trend={`${pending.length} por revisar`}
          color={KPI_COLORS.amber}
          activity={ACTIVITY_DATA.pending}
          loading={loading}
        />

        {/* Total pagos — purple (color de marca) */}
        <KpiCard
          title="Total pagos"
          value={loading ? "—" : String(payments.length)}
          trend="registros en BD"
          color={KPI_COLORS.purple}
          activity={ACTIVITY_DATA.total}
          loading={loading}
        />
      </section>

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Listado de cobros</h3>
          {/* MODIFICADO: El contador de resultados ahora es dinámico */}
          <span style={{ color: "#6b7280", fontSize: 14 }}>
            {loading ? "—" : `${payments.length} resultados`}
          </span>
        </div>

        <div className="table-responsive">
          {/* Estados de carga y error antes de renderizar la tabla.
              Antes la tabla aparecía vacía sin ningún feedback si el backend tardaba. */}
          {loading && <p className="table-feedback">Cargando pagos...</p>}
          {!loading && error && (
            <p className="table-feedback table-feedback--error">{error}</p>
          )}
          {!loading && !error && payments.length === 0 && (
            <p className="table-feedback">No hay pagos registrados.</p>
          )}

          {!loading && !error && payments.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  {/* MODIFICADO: Eliminadas las columnas "Cliente" y "Comercio" porque
                      la entidad Payment del backend no tiene esos campos directamente.
                      Se sustituyen por "Reserva" (appointmentId) que sí existe. */}
                  <th>ID</th>
                  <th>Reserva</th>
                  <th>Importe</th>
                  <th>Método</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {/* MODIFICADO: Reemplazado el map sobre el array estático payments[]
                    por el map sobre el estado payments que viene del backend. */}
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: 600 }}>#{payment.id}</td>
                    {/* Mostramos la reserva asociada por su ID */}
                    <td>Reserva #{payment.appointmentId}</td>
                    <td>{payment.amount} €</td>
                    <td>{payment.method}</td>
                    {/* Formateamos la fecha ISO que devuelve el backend a formato legible en español */}
                    <td>
                      {payment.createdAt
                        ? new Date(payment.createdAt).toLocaleDateString("es-ES")
                        : "—"}
                    </td>
                    <td>
                      <Badge status={payment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}