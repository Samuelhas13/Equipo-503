"use client"
import { FormEvent, useEffect, useState } from "react";

type Customer = {
  id: number | string;
  name: string;
  phone: string;
  email: string;
  business: string;
  nextBooking: string;
};

const initialCustomers: Customer[] = [
  {
    id: "C-001",
    name: "María López",
    phone: "600 123 456",
    email: "maria@email.com",
    business: "Peluquería Nova",
    nextBooking: "Hoy · 09:00",
  },
  {
    id: "C-002",
    name: "Carlos Pérez",
    phone: "611 456 789",
    email: "carlos@email.com",
    business: "Restaurante Marea",
    nextBooking: "Hoy · 10:30",
  },
  {
    id: "C-003",
    name: "Lucía Sánchez",
    phone: "622 987 654",
    email: "lucia@email.com",
    business: "Barber Studio",
    nextBooking: "Mañana · 12:00",
  },
];

function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <div className="customer-card">
      <p className="customer-name">{customer.name}</p>
      <p className="customer-meta">{customer.phone}</p>
      <p className="customer-meta">{customer.email}</p>
      <div className="customer-tag">{customer.business}</div>
      <div className="customer-next">
        <strong>Próxima reserva:</strong> {customer.nextBooking}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customersState, setCustomersState] = useState<Customer[]>(initialCustomers);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    business: "",
    nextBooking: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const response = await fetch("http://localhost:3000/customers");
        if (response.ok) {
          const backendCustomers = await response.json();
          setCustomersState(backendCustomers);
        }
      } catch (error) {
        console.error("Error cargando clientes desde el backend:", error);
      }
    }

    loadCustomers();
  }, []);

  const filteredCustomers = customersState.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase()) ||
    customer.business.toLowerCase().includes(search.toLowerCase())
  );

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("http://localhost:3000/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el cliente");
      }

      const newCustomer = await response.json();
      setCustomersState((current) => [...current, newCustomer]);
      setFormData({ name: "", phone: "", email: "", business: "", nextBooking: "" });
      setIsCreateOpen(false);
    } catch (error) {
      console.error("Error guardando cliente:", error);
    } finally {
      setIsSaving(false);
    }
  };

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
          <h3 className="pnal-title">Nuevo cliente</h3>
          {/* El formulario envía los datos al endpoint POST /customers del backend NestJS. */}
          {/* Esa petición es procesada por TypeORM y guardada en data/database.sqlite. */}
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
          <button className="secondary-btn" type="button">
            Filtrar
          </button>
        </div>
      </section>

      <section className="customer-grid">
        {filteredCustomers.map((customer) => (
          <CustomerCard key={`${customer.id}`} customer={customer} />
        ))}
      </section>
    </div>
  );
}