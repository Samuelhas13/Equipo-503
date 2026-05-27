"use client";

import { useEffect, useState, useRef } from "react";
import {
  Booking,
  getAppointments,
  getPayments,
  createPayment,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/api";
import type { Payment } from "@/lib/types";

type PaymentForm = {
  client: string;
  business: string;
  appointmentId: string;
  amount: string;
  method: PaymentMethod;
  date: string;
  status: PaymentStatus;
};

const initialPaymentForm: PaymentForm = {
  client: "",
  business: "",
  appointmentId: "",
  amount: "",
  method: "card",
  date: "",
  status: "paid",
};

// ─── KpiCard — Variante D ──────────────────────────────────────────────────────
// NUEVO: Componente KpiCard rediseñado con la Variante D, consistente con
// dashboard/page.tsx y BookingsClient.tsx.
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

    const bars = container.querySelectorAll(".kpi-d__dot");
    setTimeout(() => {
      bars.forEach((bar, i) => {
        const v = activity[i] ?? 0;
        const heightPx = Math.round((v / max) * 24 + 4);
        const opacity = v === max ? 1 : v > max * 0.7 ? 0.65 : 0.3;
        (bar as HTMLElement).style.height = `${heightPx}px`;
        (bar as HTMLElement).style.opacity = String(opacity);
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

// ─── Configuración visual de las tarjetas KPI ─────────────────────────────────
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

const ACTIVITY_DATA = {
  paid:    [30, 45, 20, 55, 40, 65, 50, 70, 45, 60, 55, 80, 65, 90],
  pending: [60, 40, 70, 30, 50, 20, 40, 35, 55, 25, 45, 30, 50, 20],
  total:   [50, 65, 55, 75, 60, 85, 70, 90, 75, 95, 80, 100, 90, 110],
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  card: "Tarjeta",
  bizum: "Bizum",
  cash: "Efectivo",
  pending: "Pendiente",
};

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ status }: { status: Payment["status"] }) {
  return (
    <span className={`badge badge--${status === "pending" ? "pending" : "confirmed"}`}>
      {status === "pending" ? "Por cobrar" : "Pagado"}
    </span>
  );
}

// ─── PaymentsPage ─────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(initialPaymentForm);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const amountRegex = /^[0-9]+$/;
  const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;

  // Cargamos los pagos desde el backend al montar el componente.
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

  const paid         = payments.filter((p) => p.status === "paid");
  const pending      = payments.filter((p) => p.status === "pending");
  const totalPaid    = paid.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const totalPending = pending.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const validatePaymentForm = () => {
    if (!paymentForm.client.trim() || !paymentForm.business.trim()) {
      setFormError("Cliente y comercio son obligatorios.");
      return false;
    }

    if (!nameRegex.test(paymentForm.client.trim())) {
      setFormError("El nombre del cliente solo puede contener letras y espacios.");
      return false;
    }

    if (!nameRegex.test(paymentForm.business.trim())) {
      setFormError("El nombre del comercio solo puede contener letras y espacios.");
      return false;
    }

    if (!amountRegex.test(paymentForm.amount.trim())) {
      setFormError("Importe debe ser un número entero sin decimales.");
      return false;
    }

    if (!paymentForm.date) {
      setFormError("Fecha del pago es obligatoria.");
      return false;
    }

    if (!["pending", "paid"].includes(paymentForm.status)) {
      setFormError("Estado de pago inválido.");
      return false;
    }

    setFormError("");
    return true;
  };

  const handleInputChange = (field: keyof typeof paymentForm, value: string) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSavePayment = async () => {
    if (!validatePaymentForm()) {
      return;
    }

    try {
      const newPayment = await createPayment({
        amount: Number(paymentForm.amount.trim()),
        date: paymentForm.date,
        status: paymentForm.status,
        paymentMethod: paymentForm.method,
        customerId: 1,
        appointmentId: Number(paymentForm.appointmentId) || 1,
      });

      setPayments((prev) => [newPayment, ...prev]);
      setPaymentForm(initialPaymentForm);
      setIsCreateOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar el pago");
    }
  };

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Payments</h2>
          <p>Seguimiento de cobros realizados y pendientes.</p>
        </div>
        <button
          className="primary-btn" 
          type="button"
          onClick={() => setIsCreateOpen((prev) => !prev)}
        >
          {isCreateOpen ? "Cerrar formulario" : "Registrar cobro"}
        </button>
      </section>

      {isCreateOpen && (
        <section className="section-card">
          <h3 className="panel-title">Registrar cobro</h3>

          <form className="form-grid" onSubmit={(event) => { event.preventDefault(); handleSavePayment(); }}>
            <label className="form-field">
              Cliente
              <input
                className="input"
                placeholder="Nombre del cliente"
                value={paymentForm.client}
                onChange={(event) => handleInputChange("client", event.target.value)}
                pattern="[A-Za-zÁÉÍÓÚÑáéíóúñüÜ ]+"
                title="Solo letras y espacios"
                required
              />
            </label>

            <label className="form-field">
              Comercio
              <input
                className="input"
                placeholder="Nombre del comercio"
                value={paymentForm.business}
                onChange={(event) => handleInputChange("business", event.target.value)}
                pattern="[A-Za-zÁÉÍÓÚÑáéíóúñüÜ ]+"
                title="Solo letras y espacios"
                required
              />
            </label>

            <label className="form-field">
              Importe
              <input
                className="input"
                placeholder="Ej: 28"
                value={paymentForm.amount}
                onChange={(event) => handleInputChange("amount", event.target.value)}
                inputMode="numeric"
                pattern="[0-9]+"
                title="Solo números enteros"
                required
              />
            </label>

            <label className="form-field">
              Método
              <select
                className="input"
                value={paymentForm.method}
                onChange={(event) => handleInputChange("method", event.target.value as PaymentMethod)}
              >
                <option value="card">Tarjeta</option>
                <option value="bizum">Bizum</option>
                <option value="cash">Efectivo</option>
                <option value="pending">Pendiente</option>
              </select>
            </label>

            <label className="form-field">
              Fecha
              <input
                className="input"
                type="date"
                value={paymentForm.date}
                onChange={(event) => handleInputChange("date", event.target.value)}
                required
              />
            </label>

            <label className="form-field">
              Estado
              <select
                className="input"
                value={paymentForm.status}
                onChange={(event) => handleInputChange("status", event.target.value)}
              >
                <option value="pending">Por cobrar</option>
                <option value="paid">Pagado</option>
              </select>
            </label>

            {formError && (
              <p style={{ color: "#b91c1c", fontSize: 14, gridColumn: "1 / -1" }}>
                {formError}
              </p>
            )}

            <div className="form-actions">
              <button
                className="secondary-btn"
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setFormError("");
                  setPaymentForm(initialPaymentForm);
                }}
              >
                Cancelar
              </button>

              <button className="primary-btn" type="submit">
                Guardar cobro
              </button>
            </div>
          </form>
        </section>
      )}

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
          <span style={{ color: "#6b7280", fontSize: 14 }}>
            {loading ? "—" : `${payments.length} resultados`}
          </span>
        </div>

        <div className="table-responsive">
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
                  <th>ID</th>
                  <th>Reserva</th>
                  <th>Importe</th>
                  <th>Método</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: 600 }}>#{payment.id}</td>
                    <td>Reserva #{payment.appointmentId}</td>
                    <td>{payment.amount} €</td>
                    <td>{METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod ?? "—"}</td>
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