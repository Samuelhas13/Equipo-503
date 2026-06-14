"use client";

import { useEffect, useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import {
  getBusinesses,
  updateBusiness,
  getServices,
  createService,
  updateService,
  deleteService,
  getUserById,
  updateUser,
} from "@/lib/api";
import type { Business, Service } from "@/lib/types";

export default function MiPerfilPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<"business" | "services" | "personal">("business");

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data States
  const [businessData, setBusinessData] = useState<Business | null>(null);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [personalData, setPersonalData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    numero: "",
    password: "",
  });

  // Services Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceFormMode, setServiceFormMode] = useState<"create" | "edit">("create");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    nombre: "",
    precio: 0,
  });

  // Multi-language strings
  const texts = {
    es: {
      title: "Mi Perfil",
      subtitle: "Administra la configuración de tu empresa, catálogo de servicios y datos personales.",
      tabBusiness: "Mi Empresa",
      tabServices: "Servicios",
      tabPersonal: "Datos Personales",
      businessName: "Nombre de la Empresa",
      businessAddress: "Dirección",
      saveChanges: "Guardar Cambios",
      saving: "Guardando...",
      successUpdate: "Datos actualizados correctamente.",
      errorUpdate: "No se pudieron actualizar los datos.",
      addService: "Añadir Servicio",
      serviceName: "Nombre del Servicio",
      servicePrice: "Precio (€)",
      actions: "Acciones",
      edit: "Editar",
      delete: "Eliminar",
      personalName: "Nombre",
      personalLastName: "Apellido",
      personalEmail: "Correo Electrónico",
      personalPhone: "Número de Teléfono",
      personalPassword: "Nueva Contraseña (dejar en blanco para mantener la actual)",
      saveProfile: "Guardar Perfil",
      confirmDeleteService: "¿Estás seguro de que deseas eliminar este servicio?",
      newServiceTitle: "Nuevo Servicio",
      editServiceTitle: "Editar Servicio",
      cancel: "Cancelar",
      save: "Guardar",
      errorLoad: "Error al cargar la información del perfil.",
    },
    en: {
      title: "My Profile",
      subtitle: "Manage your business settings, catalog of services, and personal data.",
      tabBusiness: "My Business",
      tabServices: "Services",
      tabPersonal: "Personal Profile",
      businessName: "Business Name",
      businessAddress: "Address",
      saveChanges: "Save Changes",
      saving: "Saving...",
      successUpdate: "Data updated successfully.",
      errorUpdate: "Failed to update data.",
      addService: "Add Service",
      serviceName: "Service Name",
      servicePrice: "Price (€)",
      actions: "Actions",
      edit: "Edit",
      delete: "Delete",
      personalName: "First Name",
      personalLastName: "Last Name",
      personalEmail: "Email Address",
      personalPhone: "Phone Number",
      personalPassword: "New Password (leave blank to keep current)",
      saveProfile: "Save Profile",
      confirmDeleteService: "Are you sure you wish to delete this service?",
      newServiceTitle: "New Service",
      editServiceTitle: "Edit Service",
      cancel: "Cancel",
      save: "Save",
      errorLoad: "Failed to load profile details.",
    },
  };

  const t = texts[language === "en" ? "en" : "es"];

  // Fetch all profile details
  const fetchProfileData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Business details if applicable
      if (user.role === "empresa" && user.businessId) {
        const businesses = await getBusinesses();
        const myBiz = businesses.find((b) => b.id === user.businessId);
        if (myBiz) {
          setBusinessData(myBiz);
        }

        // 2. Fetch Business services
        const services = await getServices();
        setServicesList(services);
      }

      // 3. Fetch Personal account data
      const personal = await getUserById(user.id);
      setPersonalData({
        nombre: personal.nombre || "",
        apellido: personal.apellido || "",
        email: personal.email || "",
        numero: personal.numero || "",
        password: "",
      });
    } catch (err) {
      console.error("Error loading profile data:", err);
      setError(t.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === "usuario") {
        setActiveTab("personal");
      }
      fetchProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Tab change helper
  const handleTabChange = (tab: "business" | "services" | "personal") => {
    setActiveTab(tab);
    setError(null);
    setSuccessMsg(null);
  };

  // Submit Business edits
  const handleBusinessSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.businessId || !businessData) return;

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updated = await updateBusiness(user.businessId, {
        nombre: businessData.nombre,
        direccion: businessData.direccion,
      });
      setBusinessData(updated);
      setSuccessMsg(t.successUpdate);
    } catch (err) {
      console.error("Error updating business data:", err);
      setError(t.errorUpdate);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Personal edits
  const handlePersonalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: any = {
        nombre: personalData.nombre,
        apellido: personalData.apellido,
        email: personalData.email,
        numero: personalData.numero,
      };
      if (personalData.password) {
        payload.password = personalData.password;
      }

      await updateUser(user.id, payload);
      setSuccessMsg(t.successUpdate);
      setPersonalData((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      console.error("Error updating personal profile:", err);
      setError(t.errorUpdate);
    } finally {
      setActionLoading(false);
    }
  };

  // Service Management
  const handleOpenCreateService = () => {
    setServiceFormMode("create");
    setSelectedService(null);
    setServiceFormData({ nombre: "", precio: 0 });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (service: Service) => {
    setServiceFormMode("edit");
    setSelectedService(service);
    setServiceFormData({ nombre: service.nombre, precio: service.precio || 0 });
    setIsServiceModalOpen(true);
  };

  const handleCloseServiceModal = () => {
    setIsServiceModalOpen(false);
    setSelectedService(null);
  };

  const handleServiceSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (serviceFormMode === "create") {
        const payload = {
          nombre: serviceFormData.nombre,
          precio: Number(serviceFormData.precio),
          businessId: user?.businessId,
        };
        const created = await createService(payload);
        setServicesList((prev) => [...prev, created]);
        setSuccessMsg(language === "en" ? "Service created." : "Servicio creado.");
      } else if (serviceFormMode === "edit" && selectedService) {
        const payload = {
          nombre: serviceFormData.nombre,
          precio: Number(serviceFormData.precio),
        };
        const updated = await updateService(selectedService.id, payload);
        setServicesList((prev) =>
          prev.map((s) => (s.id === selectedService.id ? updated : s))
        );
        setSuccessMsg(language === "en" ? "Service updated." : "Servicio actualizado.");
      }
      handleCloseServiceModal();
    } catch (err) {
      console.error("Error saving service:", err);
      setError(t.errorUpdate);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!window.confirm(t.confirmDeleteService)) return;

    setError(null);
    setSuccessMsg(null);

    try {
      await deleteService(id);
      setServicesList((prev) => prev.filter((s) => s.id !== id));
      setSuccessMsg(language === "en" ? "Service deleted." : "Servicio eliminado.");
    } catch (err) {
      console.error("Error deleting service:", err);
      setError(t.errorUpdate);
    }
  };

  if (loading) {
    return (
      <div className="page-stack" style={{ padding: "40px 0" }}>
        <div className="animate-pulse space-y-4">
          <div style={{ height: "40px", background: "var(--border)", borderRadius: "8px" }} />
          <div style={{ height: "300px", background: "var(--border)", borderRadius: "12px" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <style>{`
        .tabs-header {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 24px;
        }
        .tab-btn {
          padding: 10px 16px;
          font-weight: 600;
          font-size: 14px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }
        .tab-btn:hover {
          color: var(--text);
        }
        .tab-btn--active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
      `}</style>

      {/* Hero Header */}
      <section className="page-hero">
        <div>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </section>

      {/* Feedback Messages */}
      {error && <div className="message-error" style={{ margin: "10px 0" }}>{error}</div>}
      {successMsg && <div className="message-success" style={{ margin: "10px 0" }}>{successMsg}</div>}

      {/* Tabs Menu */}
      <div className="tabs-header">
        {user?.role === "empresa" && (
          <>
            <button
              onClick={() => handleTabChange("business")}
              className={`tab-btn ${activeTab === "business" ? "tab-btn--active" : ""}`}
              type="button"
            >
              {t.tabBusiness}
            </button>
            <button
              onClick={() => handleTabChange("services")}
              className={`tab-btn ${activeTab === "services" ? "tab-btn--active" : ""}`}
              type="button"
            >
              {t.tabServices}
            </button>
          </>
        )}
        <button
          onClick={() => handleTabChange("personal")}
          className={`tab-btn ${activeTab === "personal" ? "tab-btn--active" : ""}`}
          type="button"
        >
          {t.tabPersonal}
        </button>
      </div>

      {/* Tab 1: My Business */}
      {activeTab === "business" && businessData && (
        <section className="section-card">
          <form onSubmit={handleBusinessSubmit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t.businessName}
                </label>
                <input
                  className="input"
                  type="text"
                  value={businessData.nombre}
                  onChange={(e) => setBusinessData({ ...businessData, nombre: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t.businessAddress}
                </label>
                <input
                  className="input"
                  type="text"
                  value={businessData.direccion}
                  onChange={(e) => setBusinessData({ ...businessData, direccion: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={actionLoading}>
                {actionLoading ? t.saving : t.saveChanges}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tab 2: Services Catalog */}
      {activeTab === "services" && (
        <section className="section-card booking-table-card">
          <div className="panel-title-row" style={{ marginBottom: "16px" }}>
            <h3 className="panel-title">{t.tabServices}</h3>
            <button className="primary-btn" type="button" onClick={handleOpenCreateService}>
              {t.addService}
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t.serviceName}</th>
                  <th>{t.servicePrice}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {servicesList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
                      {language === "en" ? "No services created." : "No hay servicios creados."}
                    </td>
                  </tr>
                ) : (
                  servicesList.map((service) => (
                    <tr key={service.id}>
                      <td style={{ fontWeight: 600 }}>{service.id}</td>
                      <td>{service.nombre}</td>
                      <td>{(service.precio || 0).toLocaleString()}€</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => handleOpenEditService(service)}
                          >
                            {t.edit}
                          </button>
                          <button
                            type="button"
                            className="secondary-btn"
                            style={{ color: "var(--error)", borderColor: "var(--error)" }}
                            onClick={() => handleDeleteService(service.id)}
                          >
                            {t.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 3: Personal Profile */}
      {activeTab === "personal" && (
        <section className="section-card">
          <form onSubmit={handlePersonalSubmit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t.personalName}
                </label>
                <input
                  className="input"
                  type="text"
                  value={personalData.nombre}
                  onChange={(e) => setPersonalData({ ...personalData, nombre: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t.personalLastName}
                </label>
                <input
                  className="input"
                  type="text"
                  value={personalData.apellido}
                  onChange={(e) => setPersonalData({ ...personalData, apellido: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t.personalEmail}
                </label>
                <input
                  className="input"
                  type="email"
                  value={personalData.email}
                  onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t.personalPhone}
                </label>
                <input
                  className="input"
                  type="text"
                  value={personalData.numero}
                  onChange={(e) => setPersonalData({ ...personalData, numero: e.target.value })}
                  required
                />
              </div>

              <div className="input--full" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t.personalPassword}
                </label>
                <input
                  className="input"
                  type="password"
                  value={personalData.password}
                  onChange={(e) => setPersonalData({ ...personalData, password: e.target.value })}
                  placeholder="********"
                />
              </div>
            </div>

            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={actionLoading}>
                {actionLoading ? t.saving : t.saveProfile}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* MODAL: Add/Edit Service */}
      {isServiceModalOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseServiceModal();
          }}
        >
          <div className="modal-card" style={{ width: "min(100%, 520px)" }}>
            <h3 className="modal-title" style={{ fontSize: "22px", marginBottom: "18px" }}>
              {serviceFormMode === "create" ? t.newServiceTitle : t.editServiceTitle}
            </h3>

            <form onSubmit={handleServiceSubmit} className="page-stack" style={{ gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t.serviceName}
                </label>
                <input
                  className="input"
                  type="text"
                  value={serviceFormData.nombre}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, nombre: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t.servicePrice}
                </label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={serviceFormData.precio}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, precio: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="modal-actions" style={{ marginTop: "12px" }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleCloseServiceModal}
                  disabled={actionLoading}
                >
                  {t.cancel}
                </button>
                <button type="submit" className="primary-btn" disabled={actionLoading}>
                  {actionLoading ? t.saving : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
