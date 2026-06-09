"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getNotifications, markNotificationAsRead, deleteNotification } from "@/lib/api";
import { Notification } from "@/lib/types";

export default function NotificationCenter() {
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const texts = {
    es: {
      notifications: "Notificaciones",
      empty: "No tienes notificaciones",
      unread: "sin leer",
      delete: "Eliminar",
      markRead: "Marcar como leída",
      error: "Error al cargar",
    },
    en: {
      notifications: "Notifications",
      empty: "No notifications",
      unread: "unread",
      delete: "Delete",
      markRead: "Mark as read",
      error: "Error loading",
    },
  };

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
      setError(false);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(true);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Polling cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar al hacer clic fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      // Actualizar estado local
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      // Remover del estado local
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="notification-center" ref={containerRef}>
      <button
        type="button"
        className={`notification-bell-btn ${unreadCount > 0 ? "notification-bell-btn--active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title={texts[language].notifications}
        aria-label={`${texts[language].notifications}: ${unreadCount} ${texts[language].unread}`}
      >
        <span className="notification-bell-btn__icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-bell-btn__badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown__header">
            <h3>{texts[language].notifications}</h3>
            {unreadCount > 0 && (
              <span className="notification-dropdown__unread-count">
                {unreadCount} {texts[language].unread}
              </span>
            )}
          </div>

          <div className="notification-dropdown__list">
            {error ? (
              <div className="notification-dropdown__error">
                {texts[language].error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-dropdown__empty">
                <span className="notification-dropdown__empty-icon">🔔</span>
                <p>{texts[language].empty}</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const dateStr = new Date(notif.createdAt).toLocaleDateString(
                  language === "es" ? "es-ES" : "en-US",
                  {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

                return (
                  <div
                    key={notif.id}
                    className={`notification-item ${!notif.isRead ? "notification-item--unread" : ""}`}
                    onClick={(e) => {
                      if (!notif.isRead) {
                        handleMarkAsRead(notif.id, e);
                      }
                    }}
                  >
                    <div className="notification-item__content">
                      <h4 className="notification-item__title">{notif.title}</h4>
                      <p className="notification-item__message">{notif.message}</p>
                      <span className="notification-item__date">{dateStr}</span>
                    </div>

                    <div className="notification-item__actions">
                      {!notif.isRead && (
                        <button
                          type="button"
                          className="notification-item__action-btn notification-item__action-btn--read"
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          title={texts[language].markRead}
                        >
                          ✓
                        </button>
                      )}
                      <button
                        type="button"
                        className="notification-item__action-btn notification-item__action-btn--delete"
                        onClick={(e) => handleDelete(notif.id, e)}
                        title={texts[language].delete}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
