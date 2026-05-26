"use client";

import { useEffect, useState } from "react";
import {
  Booking,
  getAppointments,
  getPayments,
  createPayment,
  PaymentMethod,
  PaymentStatus,
  Payment,
} from "../../../lib/api";

type PaymentRow = {
  id: string;
  client: string;
  business: string;
  amount: string;
  method: string;
  date: string;
  status: PaymentStatus;
};

type PaymentForm = {
  client: any;
  business: any;
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

const initialPayments: PaymentRow[] = [];

function KpiCard({
  title,
  value,
  subtitle,
  variant,
}: {
  title: string;
  value: string;
  subtitle: string;
  variant?: "positive" | "warning";
}) {
  return (
    <div className="kpi-card">
      <p className="kpi-card__label">{title}</p>
      <h3 className="kpi-card__value">{value}</h3>
      <p
        className={`kpi-card__meta ${variant === "positive"
            ? "kpi-card__meta--positive"
            : variant === "warning"
              ? "kpi-card__meta--warning"
              : ""
          }`}
      >
        {subtitle}
      </p>
    </div>
  );
}

function Badge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`badge badge--${status === "pending" ? "pending" : "confirmed"}`}>
      {status === "pending" ? "Por cobrar" : "Pagado"}
    </span>
  );
}



export default function PaymentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [paymentsState, setPaymentsState] = useState<PaymentRow[]>(initialPayments);
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(initialPaymentForm);
  const [formError, setFormError] = useState("");
  const [backendError, setBackendError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const amountRegex = /^[0-9]+$/;
  const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;

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

  const handleSavePayment = () => {
    if (!validatePaymentForm()) {
      return;
    }

    const newPayment: PaymentRow = {
      id: `COB-${paymentsState.length + 1}`,
      client: paymentForm.client.trim(),
      business: paymentForm.business.trim(),
      amount: `${paymentForm.amount.trim()} €`,
      method: paymentForm.method,
      date: paymentForm.date,
      status: paymentForm.status,
    };

    setPaymentsState((prev) => [newPayment, ...prev]);
    setPaymentForm(initialPaymentForm);
    setIsCreateOpen(false);
  };

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Payments</h2>
          <p>Seguimiento de cobros realizados y pendientes.</p>
        </div>



        <button className="primary-btn" 
        type="button"
        onClick = {() => setIsCreateOpen((prev) => !prev) }
        >
          {isCreateOpen ? "Cerrar formulario" : "Registrar cobro" }
        </button>
      </section>

      {/* Formulario provisional para registrar un cobro.
    De momento solo prepara la interfaz, ya que todavía no está conectado a la API. */}

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
        />
      </label>

      <label className="form-field">
        Método
        <select
          className="input"
          value={paymentForm.method}
          onChange={(event) => handleInputChange("method", event.target.value)}
        >
          <option>Tarjeta</option>
          <option>Bizum</option>
          <option>Efectivo</option>
          <option>Pendiente</option>
        </select>
      </label>

      <label className="form-field">
        Fecha
        <input
          className="input"
          type="date"
          value={paymentForm.date}
          onChange={(event) => handleInputChange("date", event.target.value)}
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

    <p style={{ color: "#6b7280", fontSize: 14 }}>
      Formulario provisional con validación de importe entero
    </p>
  </section>
)}
      <section className="kpi-grid">
        <KpiCard
          title="Cobrado hoy"
          value="171 €"
          subtitle="4 operaciones registradas"
          variant="positive"
        />
        <KpiCard
          title="Pendiente"
          value="80 €"
          subtitle="1 cobro por revisar"
          variant="warning"
        />
        <KpiCard title="Método más usado" value="Tarjeta" subtitle="Mayor volumen del día" />
        <KpiCard title="Conversión" value="84%" subtitle="Cobros cerrados hoy" />
      </section>

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Listado de cobros</h3>
          <span style={{ color: "#6b7280", fontSize: 14 }}>
            {paymentsState.length} resultados
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Comercio</th>
                <th>Importe</th>
                <th>Método</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {paymentsState.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ fontWeight: 600 }}>{payment.id}</td>
                  <td>{payment.client}</td>
                  <td>{payment.business}</td>
                  <td>{payment.amount}</td>
                  <td>{payment.method}</td>
                  <td>{payment.date}</td>
                  <td>
                    <Badge status={payment.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}