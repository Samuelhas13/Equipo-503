"use client";

import { FormEvent, useState } from "react";
import type { Customer } from "@/lib/types";
import { createCustomer } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

// Props que recibe el componente desde page.tsx.
// initialCustomers contiene los clientes reales cargados desde el backend.
type CustomersClientProps = {
  initialCustomers: Customer[];
};

// Componente encargado de mostrar visualmente los datos de un cliente.
// Recibe también los textos traducidos para poder cambiar entre español e inglés.
function CustomerCard({
  customer,
  texts,
}: {
  customer: Customer;
  texts: {
    noBusiness: string;
    nextBooking: string;
    noNextBooking: string;
  };
}) {
  return (
    <div className="customer-card">
      <p className="customer-name">{customer.name}</p>
      <p className="customer-meta">{customer.phone}</p>
      <p className="customer-meta">{customer.email}</p>

      <div className="customer-tag">
        {customer.business ?? texts.noBusiness}
      </div>

      <div className="customer-next">
        <strong>{texts.nextBooking}:</strong>{" "}
        {customer.nextBooking ?? texts.noNextBooking}
      </div>
    </div>
  );
}

export default function CustomersClient({ initialCustomers }: CustomersClientProps) {

// Obtenemos el idioma global para traducir los textos de customers
  const { language } = useLanguage();

  // Textos de la página customers en español e inglés
  const texts = {
    es: {
      title: "Directorio de clientes",
      subtitle: "Gestión visual de clientes y próximas reservas.",
      newCustomer: "Nuevo cliente",
      closeForm: "Cerrar formulario",
      formTitle: "Nuevo cliente",
      name: "Nombre",
      fullName: "Nombre completo",
      phone: "Teléfono",
      email: "Email",
      business: "Negocio",
      businessPlaceholder: "Peluquería Nova",
      nextBooking: "Próxima reserva",
      nextBookingPlaceholder: "Hoy · 09:00",
      saveCustomer: "Guardar cliente",
      saving: "Guardando...",
      searchPlaceholder: "Buscar cliente...",
      filter: "Filtrar",
      noBusiness: "Sin comercio",
      noNextBooking: "Sin próxima reserva",
    },
    en: {
      title: "Customer directory",
      subtitle: "Visual management of customers and upcoming bookings.",
      newCustomer: "New customer",
      closeForm: "Close form",
      formTitle: "New customer",
      name: "Name",
      fullName: "Full name",
      phone: "Phone",
      email: "Email",
      business: "Business",
      businessPlaceholder: "Nova Hair Salon",
      nextBooking: "Next booking",
      nextBookingPlaceholder: "Today · 09:00",
      saveCustomer: "Save customer",
      saving: "Saving...",
      searchPlaceholder: "Search customer...",
      filter: "Filter",
      noBusiness: "No business",
      noNextBooking: "No upcoming booking",
    },
  };

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
          <h2>{texts[language].title}</h2>
          <p>{texts[language].subtitle}</p>
        </div>

        <button
          className="primary-btn"
          type="button"
          onClick={() => setIsCreateOpen((prev) => !prev)}
        >
          {isCreateOpen ? texts[language].closeForm : texts[language].newCustomer}
        </button>
      </section>

      {isCreateOpen && (
        <section className="section-card">
         <h3 className="panel-title">{texts[language].formTitle}</h3>

          <form onSubmit={handleCreateSubmit}>
            <div className="form-grid">
                    <label>
                      {texts[language].name}
                      <input
                        className="input margenes"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder={texts[language].fullName}
                        required
                      />
                    </label>

                    <label>
                      {texts[language].phone}
                      <input
                        className="input margenes"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="600 123 456"
                        required
                      />
                    </label>

                    <label>
                      {texts[language].email}
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
                      {texts[language].business}
                      <input
                        className="input margenes"
                        value={formData.business}
                        onChange={(e) => handleInputChange("business", e.target.value)}
                        placeholder={texts[language].businessPlaceholder}
                        required
                      />
                    </label>

                    <label>
                      {texts[language].nextBooking}
                      <input
                        className="input margenes"
                        value={formData.nextBooking}
                        onChange={(e) => handleInputChange("nextBooking", e.target.value)}
                        placeholder={texts[language].nextBookingPlaceholder}
                      />
                    </label>
              </div>

            <button className="primary-btn margenes" type="submit" disabled={isSaving}>
              {isSaving ? texts[language].saving : texts[language].saveCustomer}
            </button>
          </form>
        </section>
      )}

      <section className="section-card">
        <div className="search-row">
          <input
            className="input"
            placeholder={texts[language].searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="secondary-btn" type="button">
            {texts[language].filter}
          </button>
        </div>
      </section>

      <section className="customer-grid">
        {filteredCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            texts={texts[language]}
          />
        ))}
      </section>
    </div>
  );
}