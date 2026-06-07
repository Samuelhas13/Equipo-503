"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
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
// ─── KpiCard — Variante D — Componente KPI con diseño visual avanzado.
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
    if (loading || !barsRef.current || activity.length === 0) return;

    const container = barsRef.current;
    const max = Math.max(...activity) || 1; // Evitamos división por cero
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
              transition:
                "height 0.8s cubic-bezier(0.4,0,0.2,1), opacity 0.8s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Colores de las tarjetas KPI
const KPI_COLORS: Record<string, KpiCardColor> = {
  green: {
    bar: "#1D9E75",
    trendBg: "#E1F5EE",
    trendText: "#085041",
  },
  amber: {
    bar: "#EF9F27",
    trendBg: "#FAEEDA",
    trendText: "#412402",
  },
  purple: {
    bar: "#7F77DD",
    trendBg: "#EEEDFE",
    trendText: "#26215C",
  },
  // NUEVO: Color asignado para el KPI del método de pago preferido
  blue: {
    bar:       "#2563EB",
    trendBg:   "#DBEAFE",
    trendText: "#1E40AF",
  },
};

const ACTIVITY_DATA = {
  paid:     [30, 45, 20, 55, 40, 65, 50, 70, 45, 60, 55, 80, 65, 90],
  pending:  [60, 40, 70, 30, 50, 20, 40, 35, 55, 25, 45, 30, 50, 20],
  total:    [50, 65, 55, 75, 60, 85, 70, 90, 75, 95, 80, 100, 90, 110],
  // Datos simulados para la animación de barras del nuevo KPI
  method:   [20, 35, 40, 30, 45, 55, 40, 60, 50, 65, 70, 60, 75, 85],
};

const METHOD_LABELS: Record<string, string> = {
  tarjeta: "Tarjeta",
  card: "Tarjeta",
  bizum: "Bizum",
  efectivo: "Efectivo",
  cash: "Efectivo",
  pending: "Pendiente",
};

// Badge traducido según el idioma global
function Badge({
  status,
  texts,
}: {
  status: Payment["status"];
  texts: {
    pending: string;
    paid: string;
  };
}) {
  return (
    <span
      className={`badge badge--${
        status === "pending" ? "pending" : "confirmed"
      }`}
    >
      {status === "pending" ? texts.pending : texts.paid}
    </span>
  );
}

export default function PaymentsPage() {
  // Obtenemos el idioma global para traducir los textos de payments
  const { language } = useLanguage();

  // Textos de la página payments en español e inglés
  const texts = {
    es: {
      title: "Pagos",
      subtitle: "Seguimiento de cobros realizados y pendientes.",
      registerPayment: "Registrar cobro",
      closeForm: "Cerrar formulario",
      client: "Cliente",
      clientPlaceholder: "Nombre del cliente",
      business: "Comercio",
      businessPlaceholder: "Nombre del comercio",
      amount: "Importe",
      amountPlaceholder: "Ej: 28",
      method: "Método",
      card: "Tarjeta",
      bizum: "Bizum",
      cash: "Efectivo",
      pendingMethod: "Pendiente",
      date: "Fecha",
      status: "Estado",
      pending: "Por cobrar",
      paid: "Pagado",
      cancel: "Cancelar",
      savePayment: "Guardar cobro",
      formNote: "Formulario provisional con validación de importe entero",
      totalCharged: "Cobrado total",
      operations: "operaciones",
      pendingAmount: "Pendiente",
      paymentsToReview: "cobros por revisar",
      totalPayments: "Total pagos",
      databaseRecords: "registros en BD",
      paymentList: "Listado de cobros",
      results: "resultados",
      showing: "Mostrando",
      to: "a",
      of: "de",
      records: "registros",
      previous: "Anterior",
      next: "Siguiente",
      searchPlaceholder: "Buscar pago...",
      loadingPayments: "Cargando pagos...",
      noPayments: "No hay pagos registrados.",
      id: "ID",
      booking: "Reserva",
      requiredClientBusiness: "Cliente y comercio son obligatorios.",
      invalidClientName:
        "El nombre del cliente solo puede contener letras y espacios.",
      invalidBusinessName:
        "El nombre del comercio solo puede contener letras y espacios.",
      invalidAmount: "Importe debe ser un número entero sin decimales.",
      requiredDate: "Fecha del pago es obligatoria.",
      invalidStatus: "Estado de pago inválido.",
      savePaymentError: "Error al guardar el pago",
      onlyLetters: "Solo letras y espacios",
      onlyNumbers: "Solo números enteros",
    },
    en: {
      title: "Payments",
      subtitle: "Tracking completed and pending payments.",
      registerPayment: "Register payment",
      closeForm: "Close form",
      client: "Client",
      clientPlaceholder: "Client name",
      business: "Business",
      businessPlaceholder: "Business name",
      amount: "Amount",
      amountPlaceholder: "Example: 28",
      method: "Method",
      card: "Card",
      bizum: "Bizum",
      cash: "Cash",
      pendingMethod: "Pending",
      date: "Date",
      status: "Status",
      pending: "To collect",
      paid: "Paid",
      cancel: "Cancel",
      savePayment: "Save payment",
      formNote: "Temporary form with integer amount validation",
      totalCharged: "Total charged",
      operations: "operations",
      pendingAmount: "Pending",
      paymentsToReview: "payments to review",
      totalPayments: "Total payments",
      databaseRecords: "database records",
      paymentList: "Payment list",
      results: "results",
      showing: "Showing",
      to: "to",
      of: "of",
      records: "records",
      previous: "Previous",
      next: "Next",
      searchPlaceholder: "Search payment...",
      loadingPayments: "Loading payments...",
      noPayments: "No payments registered.",
      id: "ID",
      booking: "Booking",
      requiredClientBusiness: "Client and business are required.",
      invalidClientName: "The client name can only contain letters and spaces.",
      invalidBusinessName:
        "The business name can only contain letters and spaces.",
      invalidAmount: "Amount must be a whole number without decimals.",
      requiredDate: "Payment date is required.",
      invalidStatus: "Invalid payment status.",
      savePaymentError: "Error saving payment",
      onlyLetters: "Only letters and spaces",
      onlyNumbers: "Only whole numbers",
    },
  };

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentForm, setPaymentForm] =
    useState<PaymentForm>(initialPaymentForm);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortField, sortDirection]);

  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase();
    return payments.filter((payment) => {
      const idStr = `#${payment.id}`.toLowerCase();
      const bookingStr = `reserva #${payment.appointmentId} booking #${payment.appointmentId}`.toLowerCase();
      const amountStr = `${payment.amount} €`.toLowerCase();
      const methodLabel = (METHOD_LABELS[String(payment.paymentMethod)] || String(payment.paymentMethod || "")).toLowerCase();
      const methodRaw = String(payment.paymentMethod || "").toLowerCase();
      
      const dateStr = payment.createdAt
        ? new Date(payment.createdAt).toLocaleDateString("es-ES").toLowerCase()
        : "—";
      
      const statusStr = (payment.status === "pending"
        ? "por cobrar pending"
        : payment.status === "paid"
        ? "pagado paid"
        : ""
      ).toLowerCase();
      
      return (
        idStr.includes(q) ||
        bookingStr.includes(q) ||
        amountStr.includes(q) ||
        methodLabel.includes(q) ||
        methodRaw.includes(q) ||
        dateStr.includes(q) ||
        statusStr.includes(q)
      );
    });
  }, [payments, search]);

  const sortedPayments = useMemo(() => {
    const sorted = [...filteredPayments];
    if (!sortField) return sorted;
    sorted.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";
      switch (sortField) {
        case "id":
          valA = a.id;
          valB = b.id;
          break;
        case "appointmentId":
          valA = a.appointmentId ?? 0;
          valB = b.appointmentId ?? 0;
          break;
        case "amount":
          valA = a.amount ?? 0;
          valB = b.amount ?? 0;
          break;
        case "paymentMethod":
          valA = a.paymentMethod ?? "";
          valB = b.paymentMethod ?? "";
          break;
        case "createdAt":
          valA = a.createdAt ?? "";
          valB = b.createdAt ?? "";
          break;
        case "status":
          valA = a.status ?? "";
          valB = b.status ?? "";
          break;
        default:
          return 0;
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === "asc" ? -1 : 1;
      if (strA > strB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredPayments, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredPayments.length / 30) || 1;

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * 30;
    return sortedPayments.slice(start, start + 30);
  }, [sortedPayments, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    pages.push(1);
    if (currentPage > 3) {
      pages.push("...");
    }
    if (currentPage > 2) {
      pages.push(currentPage - 1);
    }
    if (currentPage !== 1 && currentPage !== totalPages) {
      pages.push(currentPage);
    }
    if (currentPage < totalPages - 1) {
      pages.push(currentPage + 1);
    }
    if (currentPage < totalPages - 2) {
      pages.push("...");
    }
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    return pages;
  };

  const amountRegex = /^[0-9]+$/;
  const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;

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

  // NUEVO: Cálculo dinámico de la forma de pago más utilizada y su cantidad
  const getMostUsedMethod = () => {
    if (payments.length === 0) return { label: "Ninguno", count: 0 };

    const counts = payments.reduce((acc, p) => {
      const method = p.paymentMethod;
      if (method) {
        acc[String(method)] = (acc[String(method)] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    let topMethod: PaymentMethod = "card";
    let maxCount = 0;

    (Object.keys(counts) as PaymentMethod[]).forEach((method) => {
      if (counts[method] > maxCount) {
        maxCount = counts[method];
        topMethod = method;
      }
    });

    return {
      label: METHOD_LABELS[String(topMethod)] || String(topMethod),
      count: maxCount,
    };
  };

  const mostUsed = getMostUsedMethod();

  const validatePaymentForm = () => {
    if (!paymentForm.client.trim() || !paymentForm.business.trim()) {
      setFormError(texts[language].requiredClientBusiness);
      return false;
    }
    if (!nameRegex.test(paymentForm.client.trim())) {
      setFormError(texts[language].invalidClientName);
      return false;
    }
    if (!nameRegex.test(paymentForm.business.trim())) {
      setFormError(texts[language].invalidBusinessName);
      return false;
    }
    if (!amountRegex.test(paymentForm.amount.trim())) {
      setFormError(texts[language].invalidAmount);
      return false;
    }
    if (!paymentForm.date) {
      setFormError(texts[language].requiredDate);
      return false;
    }
    if (!["pending", "paid"].includes(paymentForm.status)) {
      setFormError(texts[language].invalidStatus);
      return false;
    }
    setFormError("");
    return true;
  };

  const handleInputChange = (
    field: keyof typeof paymentForm,
    value: string
  ) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSavePayment = async () => {
    if (!validatePaymentForm()) return;

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
      setFormError(
        err instanceof Error ? err.message : texts[language].savePaymentError
      );
    }
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
          onClick={() => setIsCreateOpen((prev) => !prev)}
        >
          {isCreateOpen
            ? texts[language].closeForm
            : texts[language].registerPayment}
        </button>
      </section>

      {isCreateOpen && (
        <section className="section-card">
          <h3 className="panel-title">{texts[language].registerPayment}</h3>

          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              handleSavePayment();
            }}
          >
            <label className="form-field">
              {texts[language].client}
              <input
                className="input"
                placeholder={texts[language].clientPlaceholder}
                value={paymentForm.client}
                onChange={(event) =>
                  handleInputChange("client", event.target.value)
                }
                pattern="[A-Za-zÁÉÍÓÚÑáéíóúñüÜ ]+"
                title={texts[language].onlyLetters}
                required
              />
            </label>

            <label className="form-field">
              {texts[language].business}
              <input
                className="input"
                placeholder={texts[language].businessPlaceholder}
                value={paymentForm.business}
                onChange={(event) =>
                  handleInputChange("business", event.target.value)
                }
                pattern="[A-Za-zÁÉÍÓÚÑáéíóúñüÜ ]+"
                title={texts[language].onlyLetters}
                required
              />
            </label>

            <label className="form-field">
              {texts[language].amount}
              <input
                className="input"
                placeholder={texts[language].amountPlaceholder}
                value={paymentForm.amount}
                onChange={(event) =>
                  handleInputChange("amount", event.target.value)
                }
                inputMode="numeric"
                pattern="[0-9]+"
                title={texts[language].onlyNumbers}
                required
              />
            </label>

            <label className="form-field">
              {texts[language].method}
              <select
                className="input"
                value={paymentForm.method}
                onChange={(event) =>
                  handleInputChange("method", event.target.value as PaymentMethod)
                }
              >
                <option value="card">{texts[language].card}</option>
                <option value="bizum">{texts[language].bizum}</option>
                <option value="cash">{texts[language].cash}</option>
                <option value="pending">{texts[language].pendingMethod}</option>
              </select>
            </label>

            <label className="form-field">
              {texts[language].date}
              <input
                className="input"
                type="date"
                value={paymentForm.date}
                onChange={(event) =>
                  handleInputChange("date", event.target.value)
                }
                required
              />
            </label>

            <label className="form-field">
              {texts[language].status}
              <select
                className="input"
                value={paymentForm.status}
                onChange={(event) =>
                  handleInputChange(
                    "status",
                    event.target.value as PaymentStatus
                  )
                }
              >
                <option value="pending">{texts[language].pending}</option>
                <option value="paid">{texts[language].paid}</option>
              </select>
            </label>

            {formError && (
              <p
                style={{
                  color: "#b91c1c",
                  fontSize: 14,
                  gridColumn: "1 / -1",
                }}
              >
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
                {texts[language].cancel}
              </button>
              <button className="primary-btn" type="submit">
                {texts[language].savePayment}
              </button>
            </div>
          </form>

          <p style={{ color: "#6b7280", fontSize: 14 }}>
            {texts[language].formNote}
          </p>
        </section>
      )}

      {/* Grid de KPIs - Ahora cuenta con 4 tarjetas distribuidas de forma fluida */}
      <section className="kpi-grid">
        <KpiCard
          title={texts[language].totalCharged}
          value={`${totalPaid} €`}
          trend={`${paid.length} ${texts[language].operations}`}
          color={KPI_COLORS.green}
          activity={ACTIVITY_DATA.paid}
          loading={loading}
        />

        <KpiCard
          title={texts[language].pendingAmount}
          value={`${totalPending} €`}
          trend={`${pending.length} ${texts[language].paymentsToReview}`}
          color={KPI_COLORS.amber}
          activity={ACTIVITY_DATA.pending}
          loading={loading}
        />

        {/* NUEVO: Método preferido — azul */}
        <KpiCard
          title="Método preferido"
          value={loading ? "—" : mostUsed.label}
          trend={`${mostUsed.count} usos`}
          color={KPI_COLORS.blue}
          activity={ACTIVITY_DATA.method}
          loading={loading}
        />

        {/* Total pagos — purple */}
        <KpiCard
          title={texts[language].totalPayments}
          value={String(payments.length)}
          trend={texts[language].databaseRecords}
          color={KPI_COLORS.purple}
          activity={ACTIVITY_DATA.total}
          loading={loading}
        />
      </section>

      {!loading && !error && (
        <section className="section-card">
          <div className="search-row">
            <input
              className="input"
              placeholder={texts[language].searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>
      )}

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">{texts[language].paymentList}</h3>
          <span style={{ color: "#6b7280", fontSize: 14 }}>
            {loading ? "—" : `${filteredPayments.length} ${texts[language].results}`}
          </span>
        </div>

        <div className="table-responsive">
          {loading && (
            <p className="table-feedback">
              {texts[language].loadingPayments}
            </p>
          )}

          {!loading && error && (
            <p className="table-feedback table-feedback--error">{error}</p>
          )}

          {!loading && !error && filteredPayments.length === 0 && (
            <p className="table-feedback">{texts[language].noPayments}</p>
          )}

          {!loading && !error && filteredPayments.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => handleSort("id")}>
                      {texts[language].id}{sortField === "id" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => handleSort("appointmentId")}>
                      {texts[language].booking}{sortField === "appointmentId" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => handleSort("amount")}>
                      {texts[language].amount}{sortField === "amount" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => handleSort("paymentMethod")}>
                      {texts[language].method}{sortField === "paymentMethod" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => handleSort("createdAt")}>
                      {texts[language].date}{sortField === "createdAt" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => handleSort("status")}>
                      {texts[language].status}{sortField === "status" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: 600 }}>#{payment.id}</td>
                    <td>
                      {texts[language].booking} #{payment.appointmentId}
                    </td>
                    <td>{payment.amount} €</td>
                    <td>{payment.paymentMethod}</td>
                    <td>
                      {payment.createdAt
                        ? new Date(payment.createdAt).toLocaleDateString("es-ES")
                        : "—"}
                    </td>
                    <td>
                      <Badge status={payment.status} texts={texts[language]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && !error && filteredPayments.length > 0 && (
          <div className="pagination-container">
            <span className="pagination-info">
              {texts[language].showing} {(currentPage - 1) * 30 + 1}-{Math.min(filteredPayments.length, currentPage * 30)} {texts[language].of} {filteredPayments.length} {texts[language].records}
            </span>
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous"
                >
                  ←
                </button>
                {getPageNumbers().map((page, idx) => {
                  if (page === "...") {
                    return (
                      <span key={`dots-${idx}`} style={{ padding: "0 8px", color: "var(--muted)", fontWeight: 600 }}>
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={page}
                      type="button"
                      className={`pagination-btn ${currentPage === page ? "pagination-btn--active" : ""}`}
                      onClick={() => setCurrentPage(page as number)}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next"
                >
                  →
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}