"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { 
  getContactMessages, 
  updateContactMessageReadStatus, 
  deleteContactMessage 
} from "@/lib/api";
import { ContactMessage } from "@/lib/types";

export default function MensajesContactoPage() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [search, setSearch] = useState("");

  const texts = {
    es: {
      title: "Bandeja de Entrada de Contacto",
      subtitle: "Gestiona los mensajes enviados por los usuarios a través del formulario de contacto.",
      all: "Todos",
      unread: "No Leídos",
      read: "Leídos",
      searchPlaceholder: "Buscar por nombre, correo, asunto...",
      noMessages: "No se encontraron mensajes de contacto.",
      emptyDetails: "Selecciona un mensaje para ver sus detalles",
      markAsRead: "Marcar como leído",
      markAsUnread: "Marcar como no leído",
      delete: "Eliminar Mensaje",
      from: "De",
      email: "Correo",
      date: "Fecha",
      subject: "Asunto",
      message: "Mensaje",
      support: "Soporte Técnico",
      billing: "Facturación y Pagos",
      sales: "Ventas y Licencias",
      other: "Otro Asunto",
      confirmDelete: "¿Estás seguro de que deseas eliminar este mensaje? Esta acción no se puede deshacer.",
      deletedSuccess: "Mensaje eliminado con éxito",
      errorLoading: "Error al cargar los mensajes. Por favor, asegúrate de estar autenticado como administrador.",
    },
    en: {
      title: "Contact Inbox",
      subtitle: "Manage messages sent by users through the contact form.",
      all: "All",
      unread: "Unread",
      read: "Read",
      searchPlaceholder: "Search by name, email, subject...",
      noMessages: "No contact messages found.",
      emptyDetails: "Select a message to view details",
      markAsRead: "Mark as read",
      markAsUnread: "Mark as unread",
      delete: "Delete Message",
      from: "From",
      email: "Email",
      date: "Date",
      subject: "Subject",
      message: "Message",
      support: "Technical Support",
      billing: "Billing and Payments",
      sales: "Sales and Licenses",
      other: "Other Subject",
      confirmDelete: "Are you sure you want to delete this message? This action cannot be undone.",
      deletedSuccess: "Message deleted successfully",
      errorLoading: "Error loading messages. Please make sure you are authenticated as administrator.",
    }
  };

  const getSubjectText = (subject: string) => {
    switch (subject) {
      case "support":
        return texts[language].support;
      case "billing":
        return texts[language].billing;
      case "sales":
        return texts[language].sales;
      default:
        return texts[language].other;
    }
  };

  const getSubjectClass = (subject: string) => {
    switch (subject) {
      case "support":
        return "badge-subject-support";
      case "billing":
        return "badge-subject-billing";
      case "sales":
        return "badge-subject-sales";
      default:
        return "badge-subject-other";
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getContactMessages();
      setMessages(data);
      // Auto-update selected message details if it exists
      if (selectedMessage) {
        const updated = data.find((m) => m.id === selectedMessage.id);
        if (updated) {
          setSelectedMessage(updated);
        } else {
          setSelectedMessage(null);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(texts[language].errorLoading);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [language]);

  const handleToggleRead = async (msg: ContactMessage) => {
    try {
      const nextReadStatus = !msg.isRead;
      const updated = await updateContactMessageReadStatus(msg.id, nextReadStatus);
      
      // Update local state
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? updated : m))
      );
      if (selectedMessage && selectedMessage.id === msg.id) {
        setSelectedMessage(updated);
      }
    } catch (err) {
      console.error("Error toggling read status:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(texts[language].confirmDelete)) return;
    try {
      await deleteContactMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  // Filter and search logic
  const filteredMessages = messages.filter((msg) => {
    // 1. Filter status
    if (filter === "unread" && msg.isRead) return false;
    if (filter === "read" && !msg.isRead) return false;

    // 2. Search query
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    const subjectText = getSubjectText(msg.subject).toLowerCase();
    return (
      msg.name.toLowerCase().includes(query) ||
      msg.email.toLowerCase().includes(query) ||
      msg.message.toLowerCase().includes(query) ||
      subjectText.includes(query)
    );
  });

  return (
    <div className="page-stack">
      {/* Hero Section */}
      <section className="page-hero">
        <div>
          <h2>{texts[language].title}</h2>
          <p>{texts[language].subtitle}</p>
        </div>
      </section>

      {error ? (
        <div className="section-card" style={{ border: "1px solid var(--error)", background: "rgba(226, 75, 74, 0.1)", color: "var(--error)", padding: "20px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
          <p style={{ fontWeight: 600, margin: 0 }}>{error}</p>
          <button className="primary-btn" onClick={fetchMessages}>Retry</button>
        </div>
      ) : (
        <div className="contact-inbox-container">
          {/* Controls Bar */}
          <div className="inbox-controls-card section-card">
            <div className="inbox-filters">
              <button 
                type="button" 
                className={`filter-tab-btn ${filter === "all" ? "filter-tab-btn--active" : ""}`}
                onClick={() => setFilter("all")}
              >
                {texts[language].all} ({messages.length})
              </button>
              <button 
                type="button" 
                className={`filter-tab-btn ${filter === "unread" ? "filter-tab-btn--active" : ""}`}
                onClick={() => setFilter("unread")}
              >
                {texts[language].unread} ({messages.filter(m => !m.isRead).length})
              </button>
              <button 
                type="button" 
                className={`filter-tab-btn ${filter === "read" ? "filter-tab-btn--active" : ""}`}
                onClick={() => setFilter("read")}
              >
                {texts[language].read} ({messages.filter(m => m.isRead).length})
              </button>
            </div>

            <div className="inbox-search">
              <input
                type="text"
                className="input search-input-field"
                placeholder={texts[language].searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="clear-search-btn" onClick={() => setSearch("")}>
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* List and Details Layout */}
          <div className="inbox-content-grid">
            {/* Left Column: Messages list */}
            <div className="inbox-list-column section-card">
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "12px" }}>
                  <div className="loading-spinner"></div>
                  <p style={{ color: "var(--muted)", margin: 0 }}>Cargando...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--muted)" }}>
                  <p style={{ fontSize: "16px", margin: 0 }}>{texts[language].noMessages}</p>
                </div>
              ) : (
                <div className="inbox-list">
                  {filteredMessages.map((msg) => {
                    const isSelected = selectedMessage?.id === msg.id;
                    const dateStr = new Date(msg.createdAt).toLocaleDateString(
                      language === "es" ? "es-ES" : "en-US",
                      { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }
                    );

                    return (
                      <div 
                        key={msg.id}
                        onClick={() => {
                          setSelectedMessage(msg);
                          // Auto mark as read on click if it's unread
                          if (!msg.isRead) {
                            handleToggleRead(msg);
                          }
                        }}
                        className={`inbox-item ${isSelected ? "inbox-item--selected" : ""} ${!msg.isRead ? "inbox-item--unread" : ""}`}
                      >
                        <div className="inbox-item__header">
                          <span className="inbox-item__name">{msg.name}</span>
                          <span className="inbox-item__date">{dateStr}</span>
                        </div>
                        <div className="inbox-item__subject">
                          <span className={`badge-subject ${getSubjectClass(msg.subject)}`}>
                            {getSubjectText(msg.subject)}
                          </span>
                        </div>
                        <div className="inbox-item__snippet">
                          {msg.message}
                        </div>
                        {!msg.isRead && (
                          <div className="inbox-item__unread-indicator"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Selected Message Details */}
            <div className="inbox-details-column section-card">
              {selectedMessage ? (
                <div className="inbox-details">
                  <div className="inbox-details__header">
                    <div>
                      <h3 className="inbox-details__subject-title">
                        {getSubjectText(selectedMessage.subject)}
                      </h3>
                      <span className={`badge-subject ${getSubjectClass(selectedMessage.subject)}`} style={{ display: "inline-block", marginTop: "4px" }}>
                        {selectedMessage.subject.toUpperCase()}
                      </span>
                    </div>

                    <div className="inbox-details__actions">
                      <button 
                        type="button"
                        className="secondary-btn"
                        style={{ padding: "8px 12px", fontSize: "13px", borderRadius: "10px" }}
                        onClick={() => handleToggleRead(selectedMessage)}
                      >
                        {selectedMessage.isRead ? texts[language].markAsUnread : texts[language].markAsRead}
                      </button>
                      <button 
                        type="button"
                        className="danger-btn"
                        style={{ padding: "8px 12px", fontSize: "13px", borderRadius: "10px", minHeight: "auto" }}
                        onClick={() => handleDelete(selectedMessage.id)}
                      >
                        {texts[language].delete}
                      </button>
                    </div>
                  </div>

                  <hr className="divider" style={{ border: "0", borderTop: "1px solid var(--border)", margin: "16px 0" }} />

                  <div className="inbox-details__meta">
                    <div className="meta-row">
                      <span className="meta-label">{texts[language].from}:</span>
                      <span className="meta-value" style={{ fontWeight: 600 }}>{selectedMessage.name}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">{texts[language].email}:</span>
                      <span className="meta-value">
                        <a href={`mailto:${selectedMessage.email}`} className="email-link">
                          {selectedMessage.email}
                        </a>
                      </span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">{texts[language].date}:</span>
                      <span className="meta-value">
                        {new Date(selectedMessage.createdAt).toLocaleString(
                          language === "es" ? "es-ES" : "en-US",
                          { dateStyle: "full", timeStyle: "medium" }
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="inbox-details__body">
                    <h4 className="body-title">{texts[language].message}:</h4>
                    <div className="body-content">
                      {selectedMessage.message}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="inbox-details-empty">
                  <span className="empty-icon">✉</span>
                  <p>{texts[language].emptyDetails}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
