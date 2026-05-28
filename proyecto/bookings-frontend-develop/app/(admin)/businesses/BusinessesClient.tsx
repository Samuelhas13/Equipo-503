"use client";

import { FormEvent, useState, useRef } from "react";
import type { Business } from "@/lib/types";
import { createBusiness, updateBusiness, deleteBusiness } from "@/lib/api";

type BusinessesClientProps = {
  initialBusinesses: Business[];
};

// ─────────────────────────────────────────────
// REGEX DE VALIDACIÓN
// ─────────────────────────────────────────────

/** Teléfono: prefijo opcional (+) seguido de 9-15 dígitos */
const REGEX_PHONE = /^\+?\d{9,15}$/;

/** Nombre y categoría: letras, números, espacios, tildes, guión y apóstrofe. Mín 2 chars. */
const REGEX_NAME = /^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s\-'&,.]{2,100}$/;

/** Email estándar: xxxx@xxxx.xx */
const REGEX_EMAIL = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

/** Descripción: cualquier texto, máx 300 chars (opcional) */
const MAX_DESCRIPTION = 300;

type FormData = {
  name: string;
  category: string;
  email: string;
  phone: string;
  description: string;
};

// ─────────────────────────────────────────────
// FUNCIÓN DE VALIDACIÓN
// ─────────────────────────────────────────────

function validateForm(data: FormData): string {
  if (!data.name.trim() || !data.category.trim() || !data.email.trim() || !data.phone.trim()) {
    return "Todos los campos obligatorios deben estar rellenos.";
  }
  if (!REGEX_NAME.test(data.name.trim())) {
    return "El nombre solo puede contener letras, números, espacios y guiones (mín. 2 caracteres).";
  }
  if (!REGEX_NAME.test(data.category.trim())) {
    return "La categoría solo puede contener letras, números, espacios y guiones (mín. 2 caracteres).";
  }
  if (!REGEX_EMAIL.test(data.email.trim())) {
    return "El email no tiene un formato válido. Ejemplo: contacto@empresa.com";
  }
  if (!REGEX_PHONE.test(data.phone.trim())) {
    return "El teléfono debe contener entre 9 y 15 dígitos y puede incluir un prefijo (+).";
  }
  if (data.description && data.description.length > MAX_DESCRIPTION) {
    return `La descripción no puede superar los ${MAX_DESCRIPTION} caracteres.`;
  }
  return "";
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

export default function BusinessesClient({ initialBusinesses }: BusinessesClientProps) {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    category: "",
    email: "",
    phone: "",
    description: "",
  });

  const [editFormData, setEditFormData] = useState<FormData>({
    name: "",
    category: "",
    email: "",
    phone: "",
    description: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Filtrado de empresas por buscador
  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase()) ||
    b.email.toLowerCase().includes(search.toLowerCase()) ||
    b.phone.toLowerCase().includes(search.toLowerCase()) ||
    (b.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const uniqueCategoriesCount = new Set(businesses.map((b) => b.category.toLowerCase().trim())).size;

  function handleInputChange(field: keyof FormData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
    setFormError(""); // limpiar error al escribir
  }

  function handleEditInputChange(field: keyof FormData, value: string) {
    setEditFormData((current) => ({ ...current, [field]: value }));
    setFormError("");
  }

  // Crear empresa
  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = validateForm(formData);
    if (error) {
      setFormError(error);
      return;
    }

    setIsSaving(true);
    try {
      const newBusiness = await createBusiness({
        name: formData.name.trim(),
        category: formData.category.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        description: formData.description.trim() || undefined,
      });

      setBusinesses((current) => [newBusiness, ...current]);
      setFormData({ name: "", category: "", email: "", phone: "", description: "" });
      setIsCreateOpen(false);
      setFormError("");
    } catch (error) {
      console.error("Error guardando la empresa:", error);
      setFormError("Error al crear la empresa. Verifique que el correo no esté duplicado.");
    } finally {
      setIsSaving(false);
    }
  }

  // Activar edición de empresa
  function handleEditClick(business: Business) {
    setEditingBusiness(business);
    setEditFormData({
      name: business.name,
      category: business.category,
      email: business.email,
      phone: business.phone,
      description: business.description || "",
    });
    setIsCreateOpen(false);
    setFormError("");

    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  // Guardar edición de empresa
  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingBusiness) return;

    const error = validateForm(editFormData);
    if (error) {
      setFormError(error);
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateBusiness(editingBusiness.id, {
        name: editFormData.name.trim(),
        category: editFormData.category.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
        description: editFormData.description.trim() || undefined,
      });

      setBusinesses((current) =>
        current.map((b) => (b.id === editingBusiness.id ? updated : b))
      );
      setEditingBusiness(null);
      setFormError("");
    } catch (error) {
      console.error("Error editando la empresa:", error);
      setFormError("Error al actualizar la empresa. Verifique que los campos sean válidos.");
    } finally {
      setIsSaving(false);
    }
  }

  // Eliminar empresa
  async function handleDeleteClick(id: number) {
    if (!window.confirm("¿Está seguro de que desea eliminar esta empresa? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await deleteBusiness(id);
      setBusinesses((current) => current.filter((b) => b.id !== id));
      if (editingBusiness?.id === id) {
        setEditingBusiness(null);
      }
    } catch (error) {
      console.error("Error al eliminar la empresa:", error);
      alert("No se pudo eliminar la empresa.");
    }
  }

  return (
    <div className="page-stack">
      {/* Hero Banner */}
      <section className="page-hero">
        <div>
          <h2>Businesses Directory</h2>
          <p>Gestión visual y almacenamiento de empresas asociadas en la base de datos.</p>
        </div>

        <button
          className="primary-btn"
          type="button"
          onClick={() => {
            setIsCreateOpen((prev) => !prev);
            setEditingBusiness(null);
            setFormError("");
          }}
        >
          {isCreateOpen ? "Cerrar formulario" : "Nueva empresa"}
        </button>
      </section>

      {/* KPI Grid */}
      <section className="kpi-grid">
        <div className="kpi-card kpi-card--variant-d">
          <div className="kpi-card__accent" style={{ background: "#7F77DD" }} aria-hidden="true" />
          <div className="kpi-card__head" style={{ height: "10px" }} />
          <p className="kpi-card__label">Total Empresas</p>
          <p className="kpi-card__value">{businesses.length}</p>
        </div>

        <div className="kpi-card kpi-card--variant-d">
          <div className="kpi-card__accent" style={{ background: "#1D9E75" }} aria-hidden="true" />
          <div className="kpi-card__head" style={{ height: "10px" }} />
          <p className="kpi-card__label">Categorías Únicas</p>
          <p className="kpi-card__value">{uniqueCategoriesCount}</p>
        </div>

        <div className="kpi-card kpi-card--variant-d">
          <div className="kpi-card__accent" style={{ background: "#EF9F27" }} aria-hidden="true" />
          <div className="kpi-card__head" style={{ height: "10px" }} />
          <p className="kpi-card__label">Comercios Activos</p>
          <p className="kpi-card__value">{businesses.filter((b) => b.phone).length}</p>
        </div>
      </section>

      {/* Formulario de Nueva Empresa */}
      {isCreateOpen && (
        <section className="section-card">
          <h3 className="panel-title">Nueva empresa</h3>

          <form onSubmit={handleCreateSubmit} noValidate>
            <div className="form-grid">
              <label>
                Nombre
                <input
                  className="input margenes"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Nombre de la empresa"
                  required
                />
              </label>

              <label>
                Categoría
                <input
                  className="input margenes"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  placeholder="Ej: Belleza, Gastronomía, Salud"
                  required
                />
              </label>

              <label>
                Email
                <input
                  className="input margenes"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contacto@empresa.com"
                  required
                />
              </label>

              <label>
                Teléfono
                <input
                  className="input margenes"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Ej: 600123456"
                  required
                />
              </label>

              <label className="input--full">
                Descripción
                <input
                  className="input margenes"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Pequeña descripción de los servicios u horarios"
                />
              </label>
            </div>

            {formError && (
              <p style={{ color: "#b91c1c", fontSize: "14px", margin: "10px 0" }}>{formError}</p>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button className="primary-btn" type="submit" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar empresa"}
              </button>
              <button
                className="secondary-btn"
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setFormError("");
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Formulario de Edición de Empresa */}
      {editingBusiness && (
        <section
          ref={editFormRef}
          className="section-card"
          style={{ borderColor: "var(--indigo-500)", borderStyle: "solid", borderWidth: "1px" }}
        >
          <h3 className="panel-title">Editar empresa: {editingBusiness.name}</h3>

          <form onSubmit={handleEditSubmit} noValidate>
            <div className="form-grid">
              <label>
                Nombre
                <input
                  className="input margenes"
                  value={editFormData.name}
                  onChange={(e) => handleEditInputChange("name", e.target.value)}
                  placeholder="Nombre de la empresa"
                  required
                />
              </label>

              <label>
                Categoría
                <input
                  className="input margenes"
                  value={editFormData.category}
                  onChange={(e) => handleEditInputChange("category", e.target.value)}
                  placeholder="Ej: Belleza, Gastronomía, Salud"
                  required
                />
              </label>

              <label>
                Email
                <input
                  className="input margenes"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => handleEditInputChange("email", e.target.value)}
                  placeholder="contacto@empresa.com"
                  required
                />
              </label>

              <label>
                Teléfono
                <input
                  className="input margenes"
                  value={editFormData.phone}
                  onChange={(e) => handleEditInputChange("phone", e.target.value)}
                  placeholder="Ej: 600123456"
                  required
                />
              </label>

              <label className="input--full">
                Descripción
                <input
                  className="input margenes"
                  value={editFormData.description}
                  onChange={(e) => handleEditInputChange("description", e.target.value)}
                  placeholder="Pequeña descripción de los servicios u horarios"
                />
              </label>
            </div>

            {formError && (
              <p style={{ color: "#b91c1c", fontSize: "14px", margin: "10px 0" }}>{formError}</p>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button className="primary-btn" type="submit" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Actualizar empresa"}
              </button>
              <button
                className="secondary-btn"
                type="button"
                onClick={() => {
                  setEditingBusiness(null);
                  setFormError("");
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Buscador */}
      <section className="section-card">
        <div className="search-row">
          <input
            className="input"
            placeholder="Buscar empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* Tabla de Resultados */}
      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Listado de empresas</h3>
          <span style={{ color: "#6b7280", fontSize: 14 }}>
            {filteredBusinesses.length} resultados
          </span>
        </div>

        <div className="table-responsive">
          {filteredBusinesses.length === 0 ? (
            <p className="table-feedback">No hay empresas registradas.</p>
          ) : (
            <table className="data-table data-table--businesses">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Descripción</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.map((business) => (
                  <tr key={business.id}>
                    <td style={{ fontWeight: 600 }}>#{business.id}</td>
                    <td style={{ fontWeight: 500 }}>{business.name}</td>
                    <td>
                      <span className="customer-tag" style={{ margin: 0, display: "inline-block" }}>
                        {business.category}
                      </span>
                    </td>
                    <td>{business.email}</td>
                    <td>{business.phone}</td>
                    <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {business.description || "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          className="secondary-btn"
                          style={{ padding: "6px 12px", fontSize: "13px" }}
                          onClick={() => handleEditClick(business)}
                        >
                          Editar
                        </button>
                        <button
                          className="secondary-btn"
                          style={{ padding: "6px 12px", fontSize: "13px", color: "#b91c1c", borderColor: "#fca5a5" }}
                          onClick={() => handleDeleteClick(business.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
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