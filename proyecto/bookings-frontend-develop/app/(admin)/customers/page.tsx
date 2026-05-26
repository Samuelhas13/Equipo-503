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

  const handleCreateSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newCustomer = await createCustomer(formData);
      setCustomers((prev) => [...prev, newCustomer]);
      setFormData({ name: "", phone: "", email: "", business: "" });
      setIsCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
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
              {(["name", "phone", "email", "business"] as const).map((field) => (
                <label key={field}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                  <input
                    className="input margenes"
                    value={formData[field]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    placeholder={field}
                    required={field !== "business"}
                    type={field === "email" ? "email" : "text"}
                  />
                </label>
              ))}
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