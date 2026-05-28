"use client";

import { FormEvent, useState, useRef } from "react";
import type { Business } from "@/lib/types";
import { createBusiness, updateBusiness, deleteBusiness } from "@/lib/api";

type BusinessesClientProps = {
  initialBusinesses: Business[];
};

export default function BusinessesClient({ initialBusinesses }: BusinessesClientProps) {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  // Estados del formulario para crear
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    email: "",
    phone: "",
    description: "",
  });

  // Estados del formulario para editar
  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "",
    email: "",
    phone: "",
    description: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const amountRegex = /^\+?\d{9,15}$/;

  // Filtrado de empresas por buscador
  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase()) ||
    b.email.toLowerCase().includes(search.toLowerCase()) ||
    b.phone.toLowerCase().includes(search.toLowerCase()) ||
    (b.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Categorías únicas para el KPI
  const uniqueCategoriesCount = new Set(businesses.map((b) => b.category.toLowerCase().trim())).size;

  function handleInputChange(field: keyof typeof formData, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleEditInputChange(field: keyof typeof editFormData, value: string) {
    setEditFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // Validación de formulario
  function validateForm(data: typeof formData) {
    if (!data.name.trim() || !data.category.trim() || !data.email.trim() || !data.phone.trim()) {
      setFormError("Todos los campos obligatorios deben estar rellenos.");
      return false;
    }
    if (!amountRegex.test(data.phone.trim())) {
      setFormError("El teléfono debe contener entre 9 y 15 dígitos y puede incluir un prefijo (+).");
      return false;
    }
    setFormError("");
    return true;
  }

  // Crear empresa
  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm(formData)) return;
    setIsSaving(true);

    try {
      const newBusiness = await createBusiness({
        name: formData.name,
        category: formData.category,
        email: formData.email,
        phone: formData.phone,
        description: formData.description || undefined,
      });

      setBusinesses((current) => [newBusiness, ...current]);
      setFormData({
        name: "",
        category: "",
        email: "",
        phone: "",
        description: "",
      });
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
    if (!validateForm(editFormData)) return;
    setIsSaving(true);

    try {
      const updated = await updateBusiness(editingBusiness.id, {
        name: editFormData.name,
        category: editFormData.category,
        email: editFormData.email,
        phone: editFormData.phone,
        description: editFormData.description || undefined,
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

          <form onSubmit={handleCreateSubmit}>
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
        <section ref={editFormRef} className="section-card" style={{ borderColor: "var(--indigo-500)", borderStyle: "solid", borderWidth: "1px" }}>
          <h3 className="panel-title">Editar empresa: {editingBusiness.name}</h3>

          <form onSubmit={handleEditSubmit}>
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
