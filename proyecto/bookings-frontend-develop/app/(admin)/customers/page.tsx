"use client"
import { useState } from "react";

const customers = [
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

function CustomerCard({
  customer,
}: {
  customer: (typeof customers)[0];
}) {
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
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone.toLocaleLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLocaleLowerCase().includes(search.toLowerCase()) ||
    customer.business.toLocaleLowerCase().includes(search.toLocaleLowerCase())
  
  );

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
        onClick = {() => setIsCreateOpen((prev) => !prev) } 
        >
          {isCreateOpen ? "Cerrar formulario" : "Nuevo cliente"}
        </button>
      </section>

      {isCreateOpen && (
        < section className="section-card">
          <h3 className="pnal-title">Nuevo cliente</h3>
          <p style = {{color: "#6b7280", fontSize: 14 }}>
             Formulario pendiente de conectar
          </p>
        </section>
      )}

      <section className="section-card">
        <div className="search-row">
          <input className="input" 
          placeholder="Buscar cliente..." 
          value = {search}
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