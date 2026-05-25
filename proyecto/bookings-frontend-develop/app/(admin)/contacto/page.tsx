"use client";

import { useState, FormEvent } from "react";

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "support",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (
    field: "name" | "email" | "subject" | "message",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular envío de formulario con un efecto premium
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({
        name: "",
        email: "",
        subject: "support",
        message: "",
      });
      
      // Desvanecer el mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    }, 1200);
  };

  return (
    <div className="page-stack">
      {/* Hero Section */}
      <section className="page-hero">
        <div>
          <h2>Contacto y Soporte</h2>
          <p>¿Tienes dudas o necesitas ayuda? Ponte en contacto con el equipo de soporte de BookFlow.</p>
        </div>
      </section>

      {/* Grid Layout: Contact Info & Form */}
      <div 
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
          width: "100%",
        }}
      >
        {/* Contact Info Cards */}
        <div style={{ display: "flex", alignSelf: "stretch", flexDirection: "column", gap: "16px" }}>
          <div className="section-card" style={{ flex: 1 }}>
            <h3 className="panel-title" style={{ marginBottom: "16px" }}>Información de Contacto</h3>
            
            <div className="info-stack">
              <div className="info-box">
                <p className="info-box__eyebrow">📍 DIRECCIÓN PRINCIPAL</p>
                <h4 className="info-box__title">Oficinas BookFlow</h4>
                <p className="info-box__text">Paseo de la Castellana, 105, 28046 Madrid, España</p>
              </div>

              <div className="info-box">
                <p className="info-box__eyebrow">✉ CORREO ELECTRÓNICO</p>
                <h4 className="info-box__title">Soporte Técnico</h4>
                <p className="info-box__text">soporte@bookflow.com</p>
                <p className="info-box__text" style={{ fontSize: "12px", marginTop: "4px" }}>Respuesta en menos de 24 horas laborables.</p>
              </div>

              <div className="info-box">
                <p className="info-box__eyebrow">📞 TELÉFONO DE ATENCIÓN</p>
                <h4 className="info-box__title">Atención al Cliente</h4>
                <p className="info-box__text">+34 910 123 456</p>
                <p className="info-box__text" style={{ fontSize: "12px", marginTop: "4px" }}>Lunes a Viernes de 9:00 a 18:00.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="section-card">
          <h3 className="panel-title" style={{ marginBottom: "20px" }}>Enviar un mensaje</h3>
          
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600 }}>Nombre Completo</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Tu nombre y apellidos"
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600 }}>Correo Electrónico</label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="ejemplo@correo.com"
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600 }}>Asunto de la Consulta</label>
              <select
                className="select"
                value={formData.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
              >
                <option value="support">Soporte Técnico</option>
                <option value="billing">Facturación y Pagos</option>
                <option value="sales">Ventas y Licencias</option>
                <option value="other">Otro asunto</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600 }}>Mensaje o Comentario</label>
              <textarea
                className="input"
                style={{ minHeight: "120px", resize: "vertical", fontFamily: "inherit" }}
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                placeholder="Escribe aquí en qué podemos ayudarte..."
                required
              />
            </div>

            {submitSuccess && (
              <div className="message-success" style={{ marginTop: "8px" }}>
                ✓ ¡Mensaje enviado con éxito! Nos pondremos en contacto contigo lo antes posible.
              </div>
            )}

            <button 
              className="primary-btn" 
              type="submit" 
              disabled={isSubmitting}
              style={{ marginTop: "12px", width: "100%" }}
            >
              {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
