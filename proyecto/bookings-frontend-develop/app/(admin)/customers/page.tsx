"use client";

import { FormEvent, useEffect, useState } from "react";
import { getCustomers, createCustomer } from "@/lib/api";
import type { Customer } from "@/lib/types";

function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <div className="customer-card">
      <p className="customer-name">{customer.name}</p>
      <p className="customer-meta">{customer.phone}</p>
      <p className="customer-meta">{customer.email}</p>
      {customer.business && (
        <div className="customer-tag">{customer.business}</div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    business: "",
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const newCustomer = await createCustomer(formData);
      setCustomers((current) => [...current, newCustomer]);
      setFormData({ name: "", phone: "", email: "", business: "" });
      setIsCreateOpen(false);
    } catch (err) {
      console.error("Error guardando cliente:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = customers.filter((c) => {
    const term = search.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(term) ||
      (c.phone || "").toLowerCase().includes(term) ||
      (c.email || "").toLowerCase().includes(term) ||
      (c.business || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Customer directory</h2>
          <p>Gestión visual de clientes y próximas reservas.</p>
        </div>
        <button
          className="primary-btn"
          type="button"
          onClick={() => setIsCreateOpen((prev) => !prev)}
        >
          {isCreateOpen ? "Cerrar formulario" : "Nuevo cliente"}
        </button>
      </section>

      {isCreateOpen && (
        <section className="section-card">
          <h3 className="panel-title">Nuevo cliente</h3>
          <form onSubmit={handleCreateSubmit}>
            <div className="form-grid">
              <label>
                Nombre
                <input
                  className="input margenes"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Nombre completo"
                  required
                />
              </label>

              <label>
                Teléfono
                <input
                  className="input margenes"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="600 123 456"
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
                  placeholder="cliente@email.com"
                  required
                />
              </label>

              <label>
                Negocio
                <input
                  className="input margenes"
                  value={formData.business}
                  onChange={(e) => handleInputChange("business", e.target.value)}
                  placeholder="Peluquería Nova"
                  required
                />
              </label>
            </div>

              <button className="primary-btn margenes" type="submit" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar cliente"}
              </button>
            </form>
          </section>
        )}

      <section className="section-card">
        <div className="search-row">
          <input
            className="input"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="secondary-btn" type="button">Filtrar</button>
        </div>
      </section>

      {loading && <p className="table-feedback">Cargando clientes...</p>}
      {!loading && error && <p className="table-feedback table-feedback--error">{error}</p>}

      <section className="customer-grid">
        {filtered.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </section>
    </div>
  );
}