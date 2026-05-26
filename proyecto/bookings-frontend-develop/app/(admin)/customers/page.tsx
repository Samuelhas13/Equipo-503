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
  const [formError, setFormError] = useState("");

  const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;
  const phoneRegex = /^\+?[0-9]{9,15}$/;
  const businessRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s&'"\-,.()]+$/;

  const validateCustomerForm = (data: typeof formData) => {
    if (!data.name.trim()) return "El nombre es obligatorio";
    if (!nameRegex.test(data.name.trim())) return "El nombre solo puede contener letras, espacios y guiones";
    if (!data.phone.trim()) return "El teléfono es obligatorio";
    if (!phoneRegex.test(data.phone.trim())) return "El teléfono debe ser un número válido de 9 a 15 dígitos";
    if (!data.email.trim()) return "El correo es obligatorio";
    if (!data.business.trim()) return "El negocio es obligatorio";
    if (!businessRegex.test(data.business.trim())) return "El nombre del negocio contiene caracteres no permitidos";
    return "";
  };

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

  // 1. Blindamos el filtro contra valores nulos o "undefined" del backend
  const filteredCustomers = customersState.filter((customer) => {
    if (!customer) return false;
    const searchTerm = search.toLowerCase();

    return (
      (customer.name || "").toLowerCase().includes(searchTerm) ||
      (customer.phone || "").toLowerCase().includes(searchTerm) ||
      (customer.email || "").toLowerCase().includes(searchTerm) ||
      (customer.business || "").toLowerCase().includes(searchTerm)
    );
  });

  // 1. Definimos la estructura exacta de tu formulario (Punto 2)
  interface CustomerFormData {
    name: string;
    phone: string;
    email: string;
    business: string;
    nextBooking: string; // Añadido para que coincida con tu estado
  }

  // 3. Tu función ahora funcionará perfectamente sin errores
  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);

    const validationError = validateCustomerForm(formData);
    if (validationError) {
      setFormError(validationError);
      setIsSaving(false);
      return;
    }

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

      // 2. Nos aseguramos de que si 'nextBooking' viene vacío de NestJS, tenga un texto por defecto
      const processedCustomer = {
        ...newCustomer,
        nextBooking: newCustomer.nextBooking || "Sin reserva próxima"
      };

      setCustomersState((current) => [...current, processedCustomer]);
      setFormData({ name: "", phone: "", email: "", business: "", nextBooking: "" });
      setFormError("");
      setIsCreateOpen(false);
    } catch (error) {
      console.error("Error guardando cliente:", error);
      setFormError("No se pudo guardar el cliente. Revisa los datos y vuelve a intentarlo.");
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
                    pattern="[A-Za-zÁÉÍÓÚáéíóúÑñÜü\\s'-]+"
                    title="Solo letras, espacios, guiones y apóstrofos"
                    required
                  />
                </label>

                <label>
                  Teléfono
                  <input
                    className="input margenes"
                    type="tel"
                    inputMode="tel"
                    minLength={9}
                    maxLength={15}
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="600123456"
                    title="Número válido de 9 a 15 dígitos, opcional prefijo +"
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
                    pattern="[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\\s&'\\-,.()]+"
                    title="Solo texto, números y caracteres básicos permitidos"
                    required
                  />
                </label>
              </div>

              {formError && <div className="message-error">{formError}</div>}
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