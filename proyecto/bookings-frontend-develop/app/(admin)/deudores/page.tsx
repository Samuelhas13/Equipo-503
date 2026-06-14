"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { getPayments, updatePayment } from "@/lib/api";
import type { Payment } from "@/lib/types";

interface UnpaidBooking {
  paymentId: number;
  bookingId: number;
  date: string;
  time: string;
  serviceName: string;
  amount: number;
}

interface DebtorCustomer {
  customerId: number;
  name: string;
  email: string;
  phone: string;
  unpaidBookings: UnpaidBooking[];
  totalDebt: number;
}

export default function DebtorsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);

  const texts = {
    es: {
      title: "Clientes con Cobros Pendientes",
      subtitle: "Gestiona los clientes que tienen reservas pendientes de pago y registra sus cobros.",
      client: "Cliente",
      contact: "Contacto",
      unpaidBookingsCount: "Reservas sin pagar",
      totalDebt: "Deuda Total",
      actions: "Acciones",
      markAsPaid: "Marcar como pagado",
      loading: "Cargando cobros pendientes...",
      noDebtors: "¡Excelente! No hay clientes con cobros pendientes en este momento.",
      unpaidList: "Detalle de reservas impagadas",
      date: "Fecha",
      time: "Hora",
      service: "Servicio",
      amount: "Importe",
      successMark: "Cobro registrado correctamente.",
      errorLoad: "Error al cargar los cobros pendientes.",
      errorAction: "Error al registrar el pago.",
      totalDebtors: "Total Deudores",
      totalUnpaidAmount: "Monto Pendiente Total",
      totalUnpaidReservations: "Total Reservas Impagadas",
      searchPlaceholder: "Buscar cliente por nombre, email o teléfono...",
      expandedDetails: "Ver detalles",
      collapseDetails: "Ocultar detalles",
    },
    en: {
      title: "Customers with Pending Payments",
      subtitle: "Manage customers who have unpaid reservations and register their payments.",
      client: "Customer",
      contact: "Contact",
      unpaidBookingsCount: "Unpaid Bookings",
      totalDebt: "Total Debt",
      actions: "Actions",
      markAsPaid: "Mark as paid",
      loading: "Loading pending payments...",
      noDebtors: "Great! There are no customers with pending payments at this time.",
      unpaidList: "Unpaid bookings detail",
      date: "Date",
      time: "Time",
      service: "Service",
      amount: "Amount",
      successMark: "Payment successfully registered.",
      errorLoad: "Error loading pending payments.",
      errorAction: "Error registering payment.",
      totalDebtors: "Total Debtors",
      totalUnpaidAmount: "Total Pending Amount",
      totalUnpaidReservations: "Total Unpaid Reservations",
      searchPlaceholder: "Search customer by name, email or phone...",
      expandedDetails: "View details",
      collapseDetails: "Hide details",
    },
  };

  const currentTexts = texts[language === "es" ? "es" : "en"];
  const [search, setSearch] = useState("");

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPayments();
      setPayments(data);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(currentTexts.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user]);

  // Transform and group unpaid payments by customer
  const debtors: DebtorCustomer[] = useMemo(() => {
    const customerMap: Record<number, DebtorCustomer> = {};

    payments.forEach((pay) => {
      // We only target payments that are pending ("por cobrar" / "pending")
      if (pay.status !== "pending") return;

      const customerObj = typeof pay.customer === "object" ? pay.customer : null;
      if (!customerObj) return;

      const customerId = customerObj.id;
      const amount = pay.amount ?? 0;
      
      const appObj = typeof pay.appointment === "object" ? pay.appointment : null;
      const hora = pay.appointment && typeof pay.appointment === "object" 
        ? pay.appointment.hora_reserva 
        : pay.hora_pago || "";
      
      const parts = hora.split(" ");
      const date = parts[0] || "—";
      const time = parts[1] || "—";
      const serviceName = pay.servicio && typeof pay.servicio === "object" 
        ? pay.servicio.nombre 
        : "Servicio";

      const unpaidBooking: UnpaidBooking = {
        paymentId: pay.id,
        bookingId: pay.appointmentId || (appObj ? appObj.id : 0),
        date,
        time,
        serviceName,
        amount,
      };

      if (!customerMap[customerId]) {
        const name = `${customerObj.nombre || ""} ${customerObj.apellido || ""}`.trim() || customerObj.email || "Cliente";
        customerMap[customerId] = {
          customerId,
          name,
          email: customerObj.email || "",
          phone: customerObj.numero || "",
          unpaidBookings: [],
          totalDebt: 0,
        };
      }

      customerMap[customerId].unpaidBookings.push(unpaidBooking);
      customerMap[customerId].totalDebt += amount;
    });

    return Object.values(customerMap).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [payments]);

  // Filter debtors based on search query
  const filteredDebtors = useMemo(() => {
    if (!search.trim()) return debtors;
    const q = search.toLowerCase();
    return debtors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q)
    );
  }, [debtors, search]);

  // Compute metrics
  const metrics = useMemo(() => {
    const totalDebtors = debtors.length;
    const totalDebtAmount = debtors.reduce((sum, d) => sum + d.totalDebt, 0);
    const totalReservations = debtors.reduce((sum, d) => sum + d.unpaidBookings.length, 0);
    return { totalDebtors, totalDebtAmount, totalReservations };
  }, [debtors]);

  const handleMarkAsPaid = async (paymentId: number) => {
    setActionLoadingId(paymentId);
    setSuccessMessage(null);
    setError(null);
    try {
      await updatePayment(paymentId, { status: "paid" });
      setSuccessMessage(currentTexts.successMark);
      
      // Auto dismiss success banner after 4s
      setTimeout(() => setSuccessMessage(null), 4000);

      // Refresh list
      const data = await getPayments();
      setPayments(data);
    } catch (err) {
      console.error("Error setting payment to paid:", err);
      setError(currentTexts.errorAction);
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleExpandCustomer = (id: number) => {
    setExpandedCustomerId(expandedCustomerId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="admin-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <p style={{ color: "var(--muted)" }}>{currentTexts.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        .debtor-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }
        .debtor-card-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .debtor-card {
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--surface);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .debtor-card:hover {
          border-color: var(--border-strong);
          box-shadow: var(--shadow-md);
        }
        .debtor-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          cursor: pointer;
          user-select: none;
          flex-wrap: wrap;
          gap: 16px;
        }
        .debtor-info {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 250px;
        }
        .debtor-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--purple-100);
          color: var(--purple-900);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
        }
        html.dark .debtor-avatar {
          background: var(--purple-800);
          color: var(--purple-100);
        }
        .debtor-details {
          display: flex;
          flex-direction: column;
        }
        .debtor-name {
          font-weight: 700;
          font-size: 15px;
          color: var(--text);
        }
        .debtor-meta {
          font-size: 12px;
          color: var(--muted);
        }
        .debtor-stats-summary {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .debtor-stat-pill {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .debtor-stat-label {
          font-size: 10px;
          color: var(--muted-2);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .debtor-stat-val {
          font-size: 15px;
          font-weight: 800;
          color: var(--text);
        }
        .debtor-stat-val--danger {
          color: var(--error);
        }
        .debtor-card__body {
          border-top: 1px solid var(--border);
          background: var(--surface-2);
          padding: 20px 24px;
          animation: slideDownIn 0.2s ease-out;
        }
        .unpaid-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .unpaid-table th {
          text-align: left;
          color: var(--muted);
          font-weight: 600;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border);
        }
        .unpaid-table td {
          padding: 12px;
          border-bottom: 1px dashed var(--border);
          color: var(--text);
        }
        .unpaid-table tr:last-child td {
          border-bottom: none;
        }
        .action-button-group {
          display: flex;
          justify-content: flex-end;
        }
      `}</style>

      {/* HEADER PAGE */}
      <section className="section-card">
        <h2 className="admin-header__title" style={{ fontSize: "24px" }}>
          {currentTexts.title}
        </h2>
        <p className="admin-header__subtitle" style={{ fontSize: "14px", marginTop: "4px" }}>
          {currentTexts.subtitle}
        </p>
      </section>

      {/* BANNER NOTIFICACIÓN */}
      {successMessage && (
        <div className="message-success" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: 0 }}>
          <span>🎉 {successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} style={{ background: "none", border: "none", color: "inherit", fontWeight: "bold", cursor: "pointer" }}>✕</button>
        </div>
      )}
      {error && (
        <div className="message-error" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: 0 }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "inherit", fontWeight: "bold", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* METRICS PANEL */}
      <section className="debtor-stats-grid">
        <div className="kpi-card kpi-card--variant-d">
          <div className="kpi-card__accent" style={{ background: "var(--error)" }} />
          <p className="kpi-card__label">{currentTexts.totalDebtors}</p>
          <p className="kpi-card__value" style={{ color: "var(--error)" }}>{metrics.totalDebtors}</p>
        </div>
        
        <div className="kpi-card kpi-card--variant-d">
          <div className="kpi-card__accent" style={{ background: "var(--purple-400)" }} />
          <p className="kpi-card__label">{currentTexts.totalUnpaidAmount}</p>
          <p className="kpi-card__value">{metrics.totalDebtAmount} €</p>
        </div>

        <div className="kpi-card kpi-card--variant-d">
          <div className="kpi-card__accent" style={{ background: "var(--accent)" }} />
          <p className="kpi-card__label">{currentTexts.totalUnpaidReservations}</p>
          <p className="kpi-card__value">{metrics.totalReservations}</p>
        </div>
      </section>

      {/* FILTRO BUSCADOR */}
      <section className="section-card">
        <div className="search-row">
          <input
            className="input"
            placeholder={currentTexts.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* LISTA DE DEUDORES */}
      <section className="debtor-card-container">
        {filteredDebtors.length === 0 ? (
          <div className="section-card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>✔️</span>
            <p style={{ color: "var(--muted)", fontWeight: 500 }}>{currentTexts.noDebtors}</p>
          </div>
        ) : (
          filteredDebtors.map((debtor) => {
            const isExpanded = expandedCustomerId === debtor.customerId;
            const initials = debtor.name
              ? debtor.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
              : "C";

            return (
              <div key={debtor.customerId} className="debtor-card">
                {/* Cabecera de la tarjeta del deudor */}
                <div className="debtor-card__header" onClick={() => toggleExpandCustomer(debtor.customerId)}>
                  <div className="debtor-info">
                    <div className="debtor-avatar">{initials}</div>
                    <div className="debtor-details">
                      <span className="debtor-name">{debtor.name}</span>
                      <span className="debtor-meta">{debtor.phone || "—"}</span>
                      <span className="debtor-meta">{debtor.email}</span>
                    </div>
                  </div>

                  <div className="debtor-stats-summary">
                    <div className="debtor-stat-pill">
                      <span className="debtor-stat-label">{currentTexts.unpaidBookingsCount}</span>
                      <span className="debtor-stat-val">{debtor.unpaidBookings.length}</span>
                    </div>
                    <div className="debtor-stat-pill">
                      <span className="debtor-stat-label">{currentTexts.totalDebt}</span>
                      <span className="debtor-stat-val debtor-stat-val--danger">{debtor.totalDebt} €</span>
                    </div>
                    <div>
                      <span style={{ color: "var(--accent)", fontSize: "13px", fontWeight: 700 }}>
                        {isExpanded ? currentTexts.collapseDetails : currentTexts.expandedDetails} {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desplegable de reservas sin pagar */}
                {isExpanded && (
                  <div className="debtor-card__body">
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
                      {currentTexts.unpaidList}
                    </h4>
                    <div className="table-responsive" style={{ background: "var(--surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", padding: "10px" }}>
                      <table className="unpaid-table">
                        <thead>
                          <tr>
                            <th>{currentTexts.date}</th>
                            <th>{currentTexts.time}</th>
                            <th>{currentTexts.service}</th>
                            <th>{currentTexts.amount}</th>
                            <th style={{ textAlign: "right" }}>{currentTexts.actions}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debtor.unpaidBookings.map((booking) => (
                            <tr key={booking.paymentId}>
                              <td>{booking.date}</td>
                              <td>{booking.time}</td>
                              <td style={{ fontWeight: 600 }}>{booking.serviceName}</td>
                              <td style={{ fontWeight: 700, color: "var(--error)" }}>{booking.amount} €</td>
                              <td className="action-button-group">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsPaid(booking.paymentId);
                                  }}
                                  disabled={actionLoadingId === booking.paymentId}
                                  className="primary-btn"
                                  style={{ padding: "6px 12px", fontSize: "12px", background: "var(--success-text)", borderColor: "var(--success-text)", color: "white" }}
                                >
                                  {actionLoadingId === booking.paymentId ? "..." : currentTexts.markAsPaid}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
