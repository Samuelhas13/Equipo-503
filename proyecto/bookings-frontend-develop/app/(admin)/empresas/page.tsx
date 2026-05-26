"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createAppointment } from "@/lib/api";

interface Business {
  id: number;
  name: string;
  category: string;
  icon: string;
  desc: string;
  services: string[];
}

const AVAILABLE_BUSINESSES: Business[] = [
  {
    id: 1,
    name: "Peluquería Nova",
    category: "Belleza & Estética",
    icon: "💇",
    desc: "Cortes, peinados y tratamientos capilares de vanguardia. Reserva tu cita con nuestros estilistas profesionales.",
    services: ["Corte + Peinado", "Tinte Completo", "Tratamiento de Keratina", "Peinado de Fiesta"],
  },
  {
    id: 2,
    name: "Restaurante Marea",
    category: "Gastronomía",
    icon: "🍲",
    desc: "Comida de mar y platos mediterráneos exquisitos. Reserva una mesa para disfrutar de una velada gastronómica inigualable.",
    services: ["Almuerzo / Cena Estándar", "Menú Degustación", "Brunch Especial"],
  },
  {
    id: 3,
    name: "Barber Studio",
    category: "Barbería",
    icon: "💈",
    desc: "Cortes clásicos, arreglos de barba y afeitados premium para caballeros con estilo.",
    services: ["Corte de Caballero", "Arreglo de Barba", "Afeitado Tradicional", "Corte + Barba"],
  },
  {
    id: 4,
    name: "Gimnasio Fit",
    category: "Salud & Bienestar",
    icon: "🏋️",
    desc: "Entrenamientos personalizados, clases grupales y equipamiento de última generación.",
    services: ["Entrenamiento Personalizado", "Acceso a Sala Libre", "Clase Dirigida (Yoga/Pilates)"],
  },
  {
    id: 5,
    name: "Clínica Dental",
    category: "Salud",
    icon: "🦷",
    desc: "Odontología general, ortodoncia, implantes y estética dental para toda la familia.",
    services: ["Limpieza Dental", "Revisión + Diagnóstico", "Blanqueamiento Dental"],
  },
];

export default function EmpresasPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [service, setService] = useState("");
  const [persons, setPersons] = useState(1);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleOpenModal = (business: Business) => {
    setSelectedBusiness(business);
    setService(business.services[0]);
    setDate(getTodayString());
    setPersons(1);
    setSuccess(false);
    setError(null);
  };

  const handleCloseModal = () => {
    setSelectedBusiness(null);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness || !user) return;

    setLoading(true);
    setError(null);

    const finalServiceName = `${service} (${persons} ${persons === 1 ? "persona" : "personas"})`;

    try {
      await createAppointment({
        date,
        time,
        status: "pending",
        customerId: user.customerId || 1, // default customer ID fallback
        businessId: selectedBusiness.id,
        serviceName: finalServiceName,
      });

      setSuccess(true);
      setTimeout(() => {
        handleCloseModal();
        router.push("/bookings");
      }, 2000);
    } catch (err) {
      setError("No se pudo crear la reserva. Por favor, inténtelo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Comercios Disponibles</h2>
          <p>Explora negocios locales y reserva tu cita instantáneamente en la plataforma.</p>
        </div>
      </section>

      <section className="business-grid">
        {AVAILABLE_BUSINESSES.map((business) => (
          <div key={business.id} className="business-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="business-icon-wrapper">{business.icon}</div>
              <span className="business-category">{business.category}</span>
            </div>
            <div className="business-info">
              <h3 className="business-title">{business.name}</h3>
              <p className="business-desc">{business.desc}</p>
            </div>
            <div className="business-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={() => handleOpenModal(business)}
              >
                Reservar Cita
              </button>
            </div>
          </div>
        ))}
      </section>

      {selectedBusiness && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="modal-card" style={{ width: "min(100%, 520px)" }}>
            <h3 className="modal-title" style={{ fontSize: "24px", marginBottom: "18px" }}>
              Nueva reserva en {selectedBusiness.name}
            </h3>

            {success ? (
              <div
                className="message-success"
                style={{ textAlign: "center", margin: "20px 0", fontSize: "16px" }}
              >
                🎉 ¡Reserva creada con éxito! Redirigiendo a tus reservas...
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="page-stack" style={{ gap: 16 }}>
                {error && <div className="message-error">{error}</div>}

                <div className="form-grid">
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>Fecha</label>
                    <input
                      className="input"
                      type="date"
                      min={getTodayString()}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>Hora</label>
                    <input
                      className="input"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input--full" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>Servicio</label>
                    <select
                      className="select"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      required
                      style={{ padding: "13px 16px" }}
                    >
                      {selectedBusiness.services.map((srv) => (
                        <option key={srv} value={srv}>
                          {srv}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input--full" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>Personas (1-5)</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setPersons((prev) => Math.max(1, prev - 1))}
                        style={{ padding: "8px 16px", fontSize: "16px", fontWeight: "bold" }}
                      >
                        -
                      </button>
                      <input
                        className="input"
                        type="number"
                        min={1}
                        max={5}
                        value={persons}
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          if (val < 1) val = 1;
                          if (val > 5) val = 5;
                          setPersons(val);
                        }}
                        style={{ width: "60px", textAlign: "center", fontWeight: "bold" }}
                        required
                        readOnly
                      />
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setPersons((prev) => Math.min(5, prev + 1))}
                        style={{ padding: "8px 16px", fontSize: "16px", fontWeight: "bold" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: "12px" }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={handleCloseModal}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="primary-btn" disabled={loading}>
                    {loading ? "Creando..." : "Confirmar Reserva"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
