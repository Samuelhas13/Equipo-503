"use client";
import { useState, FormEvent } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { submitContactMessage } from "@/lib/api";

export default function ContactoPage() {

  // Obtenemos el idioma global para traducir la página de contacto
  const { language } = useLanguage();

  // Textos de la página contacto en español e inglés
  const texts = {
    es: {
      title: "Contacto y Soporte",
      subtitle: "¿Tienes dudas o necesitas ayuda? Ponte en contacto con el equipo de soporte de Turniagenidx.",
      contactInfo: "Información de Contacto",
      addressLabel: "📍 DIRECCIÓN PRINCIPAL",
      officeTitle: "Oficinas Turniagenidx",
      address: "Paseo de la Castellana, 105, 28046 Madrid, España",
      emailLabel: "✉ CORREO ELECTRÓNICO",
      supportTitle: "Soporte Técnico",
      emailResponse: "Respuesta en menos de 24 horas laborables.",
      phoneLabel: "📞 TELÉFONO DE ATENCIÓN",
      customerService: "Atención al Cliente",
      phoneSchedule: "Lunes a Viernes de 9:00 a 18:00.",
      sendMessage: "Enviar un mensaje",
      fullName: "Nombre Completo",
      fullNamePlaceholder: "Tu nombre y apellidos",
      email: "Correo Electrónico",
      emailPlaceholder: "ejemplo@correo.com",
      subject: "Asunto de la Consulta",
      support: "Soporte Técnico",
      billing: "Facturación y Pagos",
      sales: "Ventas y Licencias",
      other: "Otro asunto",
      message: "Mensaje o Comentario",
      messagePlaceholder: "Escribe aquí en qué podemos ayudarte...",
      success: "✓ ¡Mensaje enviado con éxito! Nos pondremos en contacto contigo lo antes posible.",
      sending: "Enviando...",
      send: "Enviar Mensaje",
    },
    en: {
      title: "Contact and Support",
      subtitle: "Do you have questions or need help? Contact the Turniagenidx support team.",
      contactInfo: "Contact Information",
      addressLabel: "📍 MAIN ADDRESS",
      officeTitle: "Turniagenidx Offices",
      address: "Paseo de la Castellana, 105, 28046 Madrid, Spain",
      emailLabel: "✉ EMAIL",
      supportTitle: "Technical Support",
      emailResponse: "Response in less than 24 business hours.",
      phoneLabel: "📞 CUSTOMER SERVICE PHONE",
      customerService: "Customer Service",
      phoneSchedule: "Monday to Friday from 9:00 to 18:00.",
      sendMessage: "Send a message",
      fullName: "Full Name",
      fullNamePlaceholder: "Your first and last name",
      email: "Email",
      emailPlaceholder: "example@email.com",
      subject: "Subject",
      support: "Technical Support",
      billing: "Billing and Payments",
      sales: "Sales and Licenses",
      other: "Other subject",
      message: "Message or Comment",
      messagePlaceholder: "Write here how we can help you...",
      success: "✓ Message sent successfully! We will contact you as soon as possible.",
      sending: "Sending...",
      send: "Send Message",
    },
  };

  const [formData, setFormData] = useState<{
    name: string;
    subject: "support" | "billing" | "sales" | "other";
    message: string;
  }>({
    name: "",
    subject: "support",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const handleInputChange = (
    field: "name" | "subject" | "message",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    } as typeof prev));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(false);
    
    try {
      await submitContactMessage({
        name: formData.name,
        subject: formData.subject,
        message: formData.message,
      });
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({
        name: "",
        subject: "support",
        message: "",
      });
      
      // Desvanecer el mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Error submitting contact message:", error);
      setIsSubmitting(false);
      setSubmitError(true);
    }
  };

  return (
    <div className="page-stack">
      {/* Hero Section */}
      <section className="page-hero">
        <div>
          <h2>{texts[language].title}</h2>
          <p>{texts[language].subtitle}</p>
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
            <h3 className="panel-title" style={{ marginBottom: "16px" }}> {texts[language].contactInfo}</h3>
            
            <div className="info-stack">
              <div className="info-box">
                <p className="info-box__eyebrow">{texts[language].addressLabel}</p>
                <h4 className="info-box__title">{texts[language].officeTitle}</h4>
                <p className="info-box__text">{texts[language].address}</p>
              </div>

              <div className="info-box">
                <p className="info-box__eyebrow">{texts[language].emailLabel}</p>
                <h4 className="info-box__title">{texts[language].supportTitle}</h4>
                <p className="info-box__text">soporte@turniagenidx.com</p>
                <p className="info-box__text" style={{ fontSize: "12px", marginTop: "4px" }}>{texts[language].emailResponse}</p>
              </div>

              <div className="info-box">
                <p className="info-box__eyebrow">{texts[language].phoneLabel}</p>
                <h4 className="info-box__title">{texts[language].customerService}</h4>
                <p className="info-box__text">+34 910 123 456</p>
                <p className="info-box__text" style={{ fontSize: "12px", marginTop: "4px" }}>{texts[language].phoneSchedule}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="section-card">
          <h3 className="panel-title" style={{ marginBottom: "20px" }}>{texts[language].sendMessage}</h3>
          
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600 }}>{texts[language].fullName}</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={texts[language].fullNamePlaceholder}
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600 }}>{texts[language].subject}</label>
              <select
                className="select"
                value={formData.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
              >
                <option value="support">{texts[language].support}</option>
                <option value="billing">{texts[language].billing}</option>
                <option value="sales">{texts[language].sales}</option>
                <option value="other">{texts[language].other}</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600 }}> {texts[language].message}</label>
              <textarea
                className="input"
                style={{ minHeight: "120px", resize: "vertical", fontFamily: "inherit" }}
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                placeholder={texts[language].messagePlaceholder}
                required
              />
            </div>

            {submitSuccess && (
              <div className="message-success" style={{ marginTop: "8px" }}>
                {texts[language].success}
              </div>
            )}

            {submitError && (
              <div className="message-error" style={{ marginTop: "8px", padding: "12px", borderRadius: "10px", background: "rgba(226, 75, 74, 0.1)", border: "1px solid var(--error)", color: "var(--error)", fontSize: "14px", fontWeight: 500 }}>
                {language === "es" 
                  ? "✗ Hubo un error al enviar el mensaje. Inténtalo de nuevo." 
                  : "✗ There was an error sending your message. Please try again."}
              </div>
            )}

            <button 
              className="primary-btn" 
              type="submit" 
              disabled={isSubmitting}
              style={{ marginTop: "12px", width: "100%" }}
            >
              {isSubmitting ? texts[language].sending : texts[language].send}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
