"use client";

import { useEffect, useState } from "react";
import { getPayments } from "@/lib/api";
import type { Payment } from "@/lib/types";

function KpiCard({ title, value, subtitle, variant }: {
  title: string; value: string; subtitle: string; variant?: "positive" | "warning";
}) {
  return (
    <div className="kpi-card">
      <p className="kpi-card__label">{title}</p>
      <h3 className="kpi-card__value">{value}</h3>
      <p className={`kpi-card__meta ${variant === "positive" ? "kpi-card__meta--positive" : variant === "warning" ? "kpi-card__meta--warning" : ""}`}>
        {subtitle}
      </p>
    </div>
  );
}

function Badge({ status }: { status: Payment["status"] }) {
  return (
    <span className={`badge badge--${status === "pending" ? "pending" : "confirmed"}`}>
      {status === "pending" ? "Por cobrar" : "Pagado"}
    </span>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const paid = payments.filter((p) => p.status === "paid");
  const pending = payments.filter((p) => p.status === "pending");
  const totalPaid = paid.reduce((sum, p) => sum + (p.amount ?? 0), 0);
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

      <section className="kpi-grid">
        <KpiCard
          title="Cobrado total"
          value={loading ? "—" : `${totalPaid} €`}
          subtitle={`${paid.length} operaciones`}
          variant="positive"
        />
        <KpiCard
          title="Pendiente"
          value={loading ? "—" : `${totalPending} €`}
          subtitle={`${pending.length} cobros por revisar`}
          variant="warning"
        />
        <KpiCard
          title="Total pagos"
          value={loading ? "—" : String(payments.length)}
          subtitle="registros en BD"
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
          {!loading && error && <p className="table-feedback table-feedback--error">{error}</p>}
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
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>#{p.id}</td>
                    <td>Reserva #{p.appointmentId}</td>
                    <td>{p.amount} €</td>
                    <td>{p.method}</td>
                    <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString("es-ES") : "—"}</td>
                    <td><Badge status={p.status} /></td>
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