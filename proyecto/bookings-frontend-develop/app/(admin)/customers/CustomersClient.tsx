"use client";

import { FormEvent, useState } from "react";
import type { Customer } from "@/lib/types";
import { createCustomer } from "@/lib/api";

// Props que recibe el componente desde page.tsx.
// initialCustomers contiene los clientes reales cargados desde el backend.
type CustomersClientProps = {
  initialCustomers: Customer[];
};

// Componente encargado de mostrar visualmente los datos de un cliente.
function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <div className="customer-card">
      <p className="customer-name">{customer.name}</p>
      <p className="customer-meta">{customer.phone}</p>
      <p className="customer-meta">{customer.email}</p>

      <div className="customer-tag">
        {customer.business ?? "Sin comercio"}
      </div>

      <div className="customer-next">
        <strong>Próxima reserva:</strong>{" "}
        {customer.nextBooking ?? "Sin próxima reserva"}
      </div>
    </div>
  );
}

export default function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const [search, setSearch] = useState("");  // Estado para controlar el texto introducido en el buscador.
  const [isCreateOpen, setIsCreateOpen] = useState(false);  // Estado para abrir o cerrar el formulario de nuevo cliente.
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);  // Estado que guarda la lista de clientes mostrada en pantalla.

  // Estado que guarda los datos escritos en el formulario de creación.
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    business: "",
    nextBooking: "",
  });

  const [isSaving, setIsSaving] = useState(false);  // Estado para indicar si se está guardando un cliente.

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase()) ||
    (customer.business ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function handleInputChange(field: keyof typeof formData, value: string) {  // Actualiza un campo concreto del formulario sin modificar el resto.
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {  // Envía los datos del formulario al backend para crear un nuevo cliente.
    event.preventDefault();
    setIsSaving(true);

    try {
      const newCustomer = await createCustomer(formData);

      setCustomers((current) => [...current, newCustomer]);
      setFormData({
        name: "",
        phone: "",
        email: "",
        business: "",
        nextBooking: "",
      });
      setIsCreateOpen(false);
    } catch (error) {
      console.error("Error guardando cliente:", error);
    } finally {
      setIsSaving(false);
    }
  }
/* Formulario para crear un nuevo cliente.
    Al enviarlo, llama al endpoint POST /customers mediante createCustomer(). */
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

              <label>
                Próxima reserva
                <input
                  className="input margenes"
                  value={formData.nextBooking}
                  onChange={(e) => handleInputChange("nextBooking", e.target.value)}
                  placeholder="Hoy · 09:00"
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

          <button className="secondary-btn" type="button">
            Filtrar
          </button>
        </div>
      </section>

      <section className="customer-grid">
        {filteredCustomers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </section>
    </div>
  );
}