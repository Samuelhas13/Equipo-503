"use client";

// 1. Importamos useRef de React
import { useMemo, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import type {
  Booking,
  BookingStatus,
  CreateBookingDto,
  UpdateBookingDto,
} from "@/lib/api";
import {
  createAppointment,
  deleteAppointment,
  updateAppointment,
} from "@/lib/api";

const BUSINESS_NAMES: Record<number, string> = {
  1: "Peluquería Nova",
  2: "Restaurante Marea",
  3: "Barber Studio",
  4: "Gimnasio Fit",
  5: "Clínica Dental",
};

function StatusBadge({ status }: { status: BookingStatus }) {       // funcion que consiste en mostrar el estado de una reserva utilizando un label,
  const label =                                                     // es decir si una reserva tiene el estado pending en la pantalla mostrara el estado pendiente
    status === "pending"
      ? "Pendiente"
      : status === "confirmed"
        ? "Confirmada"
        : "Pagada";

  return <span className={`badge badge--${status}`}>{label}</span>;
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export default function BookingsClient({
  initialBookings,
}: {
  initialBookings: Booking[];
}) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getCurrentTimeString = () => {
    const today = new Date();
    const hours = String(today.getHours()).padStart(2, "0");
    const minutes = String(today.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const emptyForm: CreateBookingDto = {
    date: getTodayString(),
    time: getCurrentTimeString(),
    status: "pending",
    customerId: 1,
    businessId: 1,
    serviceName: "",
  };

  const [createForm, setCreateForm] = useState<CreateBookingDto>(emptyForm);
  const [editForm, setEditForm] = useState<CreateBookingDto>(emptyForm);

  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");   //Esto guarda qué filtro está seleccionado.
  const [loadingCreate, setLoadingCreate] = useState(false);                        //Sirven para saber si se está creando o editando una reserva.
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);  //Guarda el id de la reserva que se está eliminando en ese momento.
  const [successMessage, setSuccessMessage] = useState("");                         //Guardan los mensajes que se enseñan al usuario.
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);                          //Controla si el formulario de crear reserva está abierto o cerrado.
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);    //Guarda el id de la reserva que se está editando.
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);        //Guarda el id de la reserva que el usuario quiere eliminar.

  const [searchedCustomer, setSearchedCustomer] = useState<{ id: number; name: string; email: string; phone: string } | null>(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [createPersons, setCreatePersons] = useState<number>(1);
  const [editPersons, setEditPersons] = useState<number>(1);

  async function findCustomer(id: number) {
    if (!id || isNaN(id)) return;
    setSearchingCustomer(true);
    setSearchedCustomer(null);
    setErrorMessage("");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${API_URL}/customers/${id}`);
      if (!res.ok) {
        throw new Error("Cliente no encontrado");
      }
      const customer = await res.json();
      setSearchedCustomer(customer);
    } catch (err: any) {
      setErrorMessage("No se encontró ningún cliente con ese ID en el sistema.");
    } finally {
      setSearchingCustomer(false);
    }
  }

  const createFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  const roleFilteredBookings = useMemo(() => {
    if (user?.role === "empresa") {
      return bookings.filter((b) => b.businessId === user.businessId);
    } else if (user?.role === "usuario") {
      return bookings.filter((b) => b.customerId === user.customerId);
    }
    return bookings;
  }, [bookings, user]);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return roleFilteredBookings;
    return roleFilteredBookings.filter((booking) => booking.status === statusFilter);
  }, [roleFilteredBookings, statusFilter]);

  const totalCount = roleFilteredBookings.length;
  const pendingCount = roleFilteredBookings.filter((b) => b.status === "pending").length;
  const confirmedCount = roleFilteredBookings.filter((b) => b.status === "confirmed").length;
  const paidCount = roleFilteredBookings.filter((b) => b.status === "paid").length;

  function updateCreateForm<K extends keyof CreateBookingDto>(
    key: K,
    value: CreateBookingDto[K]
  ) {
    setCreateForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateEditForm<K extends keyof CreateBookingDto>(
    key: K,
    value: CreateBookingDto[K]
  ) {
    setEditForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetCreateForm() {
    setCreateForm(emptyForm);
  }

  function resetEditForm() {
    setEditForm(emptyForm);
  }

  // 3. Modificamos la apertura para añadir el scroll
  function openCreateForm() {                                                               // esta funcion se ejecuta cuando pulsas nueva reserva
    setSuccessMessage(""); 
    setErrorMessage("");
    setEditingBookingId(null);
    setDeleteTargetId(null);
    setCreatePersons(1);
    setSearchedCustomer(null);
    resetEditForm();
    setIsCreateOpen(true);

    const initialCustomerId = user?.role === "usuario" ? (user.customerId || 1) : 1;
    const initialBusinessId = user?.role === "empresa" ? (user.businessId || 1) : 1;

    setCreateForm({
      date: getTodayString(),
      time: getCurrentTimeString(),
      status: "pending",
      customerId: initialCustomerId,
      businessId: initialBusinessId,
      serviceName: "",
    });

    // El setTimeout asegura que el DOM ya se actualizó y el elemento existe
    setTimeout(() => {
      createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function closeCreateForm() {
    setErrorMessage("");
    resetCreateForm();
    setIsCreateOpen(false);
  }

  // 4. Modificamos la apertura de edición para añadir el scroll
  function openEditForm(booking: Booking) {
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreateOpen(false);
    setDeleteTargetId(null);
    setEditingBookingId(booking.id);

    // Intentar extraer el número de personas del nombre del servicio
    let cleanServiceName = booking.serviceName;
    let parsedPersons = 1;
    const match = booking.serviceName.match(/(.*) \((\d+) personas?\)/);
    if (match) {
      cleanServiceName = match[1].trim();
      parsedPersons = Number(match[2]);
    }

    setEditPersons(parsedPersons);
    setEditForm({
      date: booking.date,
      time: booking.time,
      status: booking.status,
      customerId: booking.customerId,
      businessId: booking.businessId,
      serviceName: cleanServiceName,
    });

    // Desplazamiento suave hacia el formulario de edición
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function closeEditForm() {
    setErrorMessage("");
    setEditingBookingId(null);
    resetEditForm();
  }

  function openDeleteModal(id: number) {
    setErrorMessage("");
    setSuccessMessage("");
    setDeleteTargetId(id);
  }

  function closeDeleteModal() {
    setDeleteTargetId(null);
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingCreate(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const finalServiceName = `${createForm.serviceName} (${createPersons} ${createPersons === 1 ? 'persona' : 'personas'})`;
      const payload = {
        ...createForm,
        serviceName: finalServiceName,
      };

      const created = await createAppointment(payload);
      setBookings((prev) => [created, ...prev]);
      resetCreateForm();
      setCreatePersons(1);
      setSearchedCustomer(null);
      setIsCreateOpen(false);
      setSuccessMessage("Reserva creada correctamente.");
    } catch {
      setErrorMessage("No se pudo crear la reserva. Revisa los datos o el backend.");
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingBookingId) return;
    setLoadingEdit(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const finalServiceName = `${editForm.serviceName} (${editPersons} ${editPersons === 1 ? 'persona' : 'personas'})`;
      const payload: UpdateBookingDto = {
        date: editForm.date,
        time: editForm.time,
        status: editForm.status,
        serviceName: finalServiceName,
      };

      const updated = await updateAppointment(editingBookingId, payload);

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === editingBookingId ? updated : booking
        )
      );

      setEditingBookingId(null);
      resetEditForm();
      setSuccessMessage("Reserva actualizada correctamente.");
    } catch {
      setErrorMessage("No se pudo actualizar la reserva.");
    } finally {
      setLoadingEdit(false);
    }
  }

  async function confirmDelete() {
    if (deleteTargetId === null) return;

    setDeletingBookingId(deleteTargetId);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await deleteAppointment(deleteTargetId);
      setBookings((prev) => prev.filter((booking) => booking.id !== deleteTargetId));

      if (editingBookingId === deleteTargetId) {
        closeEditForm();
      }

      setSuccessMessage("Reserva eliminada correctamente.");
      closeDeleteModal();
    } catch {
      setErrorMessage("No se pudo eliminar la reserva.");
    } finally {
      setDeletingBookingId(null);
    }
  }

  return (
    <div className="booking-page page-stack">
      <section className="page-hero booking-hero">
        <div>
          <h2>Bookings list</h2>
          <p>Gestión de reservas conectada con la API.</p>
        </div>

        <button className="primary-btn" type="button" onClick={openCreateForm}>
          Nueva reserva
        </button>
      </section>

      <section className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-card__label">Total reservas</p>
          <h3 className="kpi-card__value">{totalCount}</h3>
          <p className="kpi-card__meta">Registros disponibles</p>
        </div>

        <div className="kpi-card">
          <p className="kpi-card__label">Pendientes</p>
          <h3 className="kpi-card__value">{pendingCount}</h3>
          <p className="kpi-card__meta kpi-card__meta--warning">
            Requieren seguimiento
          </p>
        </div>

        <div className="kpi-card">
          <p className="kpi-card__label">Confirmadas</p>
          <h3 className="kpi-card__value">{confirmedCount}</h3>
          <p className="kpi-card__meta kpi-card__meta--positive">
            Estado activo
          </p>
        </div>

        <div className="kpi-card">
          <p className="kpi-card__label">Pagadas</p>
          <h3 className="kpi-card__value">{paidCount}</h3>
          <p className="kpi-card__meta">Reservas cerradas</p>
        </div>
      </section>

      {isCreateOpen && (
        /* 5. AÑADIDO: ref={createFormRef} al elemento section */
        <section ref={createFormRef} className="section-card booking-form-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nueva reserva</h3>
            <button type="button" className="secondary-btn" onClick={closeCreateForm}>
              Cancelar
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Fecha</label>
                <input
                  className="input"
                  type="date"
                  min={getTodayString()}
                  value={createForm.date}
                  onChange={(e) => updateCreateForm("date", e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Hora</label>
                <input
                  className="input"
                  type="time"
                  value={createForm.time}
                  onChange={(e) => updateCreateForm("time", e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Estado</label>
                <select
                  className="select"
                  value={createForm.status}
                  onChange={(e) =>
                    updateCreateForm("status", e.target.value as BookingStatus)
                  }
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="paid">Pagada</option>
                </select>
              </div>
              
              {user?.role !== "usuario" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>ID Cliente</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      value={createForm.customerId}
                      onChange={(e) => {
                        updateCreateForm("customerId", Number(e.target.value));
                        setSearchedCustomer(null);
                      }}
                      placeholder="Customer ID"
                      required
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => findCustomer(createForm.customerId)}
                      disabled={searchingCustomer}
                      style={{ whiteSpace: 'nowrap', padding: '10px 16px' }}
                    >
                      {searchingCustomer ? "Buscando..." : "Buscar"}
                    </button>
                  </div>
                </div>
              )}

              {user?.role === "admin" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>ID Negocio</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={createForm.businessId}
                    onChange={(e) =>
                      updateCreateForm("businessId", Number(e.target.value))
                    }
                    placeholder="Business ID"
                    required
                  />
                </div>
              )}

              {user?.role === "usuario" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Comercio</label>
                  <select
                    className="select"
                    value={createForm.businessId}
                    onChange={(e) => updateCreateForm("businessId", Number(e.target.value))}
                    required
                    style={{ padding: "13px 16px" }}
                  >
                    {Object.entries(BUSINESS_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Personas (1-5)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setCreatePersons(prev => Math.max(1, prev - 1))}
                    style={{ padding: '8px 16px', fontSize: '16px', fontWeight: 'bold' }}
                  >
                    -
                  </button>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={5}
                    value={createPersons}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (val < 1) val = 1;
                      if (val > 5) val = 5;
                      setCreatePersons(val);
                    }}
                    style={{ width: '60px', textAlign: 'center', fontWeight: 'bold' }}
                    required
                  />
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setCreatePersons(prev => Math.min(5, prev + 1))}
                    style={{ padding: '8px 16px', fontSize: '16px', fontWeight: 'bold' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="input--full" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Servicio</label>
                <input
                  className="input"
                  type="text"
                  value={createForm.serviceName}
                  onChange={(e) => updateCreateForm("serviceName", e.target.value)}
                  placeholder="Servicio"
                  required
                />
              </div>
            </div>

            {searchedCustomer && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(46, 204, 113, 0.08)',
                border: '1px solid rgba(46, 204, 113, 0.3)',
                color: '#27ae60',
                fontSize: '13px'
              }}>
                <strong style={{ fontSize: '14px', color: '#219653' }}>✓ Cliente seleccionado encontrado:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  <span><strong>Nombre:</strong> {searchedCustomer.name}</span>
                  <span><strong>Email:</strong> {searchedCustomer.email}</span>
                  <span><strong>Teléfono:</strong> {searchedCustomer.phone}</span>
                </div>
              </div>
            )}

            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? "Guardando..." : "Crear reserva"}
              </button>
            </div>
          </form>
        </section>
      )}

      {editingBookingId !== null && (
        /* 6. AÑADIDO: ref={editFormRef} al elemento section */
        <section ref={editFormRef} className="section-card booking-form-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Editar reserva #{editingBookingId}</h3>
            <button type="button" className="secondary-btn" onClick={closeEditForm}>
              Cancelar
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Fecha</label>
                <input
                  className="input"
                  type="date"
                  min={getTodayString()}
                  value={editForm.date}
                  onChange={(e) => updateEditForm("date", e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Hora</label>
                <input
                  className="input"
                  type="time"
                  value={editForm.time}
                  onChange={(e) => updateEditForm("time", e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Estado</label>
                <select
                  className="select"
                  value={editForm.status}
                  onChange={(e) =>
                    updateEditForm("status", e.target.value as BookingStatus)
                  }
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="paid">Pagada</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>ID Cliente (Inmutable)</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={editForm.customerId}
                  placeholder="Customer ID"
                  disabled
                  title="El Customer ID no se puede modificar una vez creada la reserva"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>ID Negocio (Inmutable)</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={editForm.businessId}
                  placeholder="Business ID"
                  disabled
                  title="El Business ID no se puede modificar una vez creada la reserva"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Personas (1-5)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setEditPersons(prev => Math.max(1, prev - 1))}
                    style={{ padding: '8px 16px', fontSize: '16px', fontWeight: 'bold' }}
                  >
                    -
                  </button>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={5}
                    value={editPersons}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (val < 1) val = 1;
                      if (val > 5) val = 5;
                      setEditPersons(val);
                    }}
                    style={{ width: '60px', textAlign: 'center', fontWeight: 'bold' }}
                    required
                  />
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setEditPersons(prev => Math.min(5, prev + 1))}
                    style={{ padding: '8px 16px', fontSize: '16px', fontWeight: 'bold' }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="input--full" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Servicio</label>
                <input
                  className="input"
                  type="text"
                  value={editForm.serviceName}
                  onChange={(e) => updateEditForm("serviceName", e.target.value)}
                  placeholder="Servicio"
                  required
                />
              </div>
            </div>

            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingEdit}>
                {loadingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      )}

      {deleteTargetId !== null && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          aria-describedby="delete-modal-description"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteModal();
          }}
        >
          <div className="modal-card">
            <div className="modal-icon">!</div>
            <h3 id="delete-modal-title" className="modal-title">
              Eliminar reserva
            </h3>
            <p id="delete-modal-description" className="modal-text">
              ¿Seguro que quieres eliminar la reserva #{deleteTargetId}? Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={closeDeleteModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={confirmDelete}
                disabled={deletingBookingId === deleteTargetId}
              >
                {deletingBookingId === deleteTargetId ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="section-card booking-table-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Reservas registradas</h3>
          <div className="filter-row">
            <button
              type="button"
              className={`filter-pill ${statusFilter === "all" ? "filter-pill--active" : ""}`}
              aria-pressed={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            >
              Todas
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === "pending" ? "filter-pill--active" : ""}`}
              aria-pressed={statusFilter === "pending"}
              onClick={() => setStatusFilter("pending")}
            >
              Pendientes
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === "confirmed" ? "filter-pill--active" : ""}`}
              aria-pressed={statusFilter === "confirmed"}
              onClick={() => setStatusFilter("confirmed")}
            >
              Confirmadas
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === "paid" ? "filter-pill--active" : ""}`}
              aria-pressed={statusFilter === "paid"}
              onClick={() => setStatusFilter("paid")}
            >
              Pagadas
            </button>
          </div>
        </div>

        {successMessage ? <div className="message-success" style={{ marginBottom: 12 }}>{successMessage}</div> : null}
        {errorMessage ? <div className="message-error" style={{ marginBottom: 12 }}>{errorMessage}</div> : null}

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Servicio</th>
                <th>Customer</th>
                <th>Comercio</th>
                <th>Estado</th>
                {user?.role !== "usuario" && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td style={{ fontWeight: 600 }}>{booking.id}</td>
                  <td>{formatDate(booking.date)}</td>
                  <td>{booking.time}</td>
                  <td>{booking.serviceName}</td>
                  <td>{booking.customerId}</td>
                  <td>{BUSINESS_NAMES[booking.businessId] || `#${booking.businessId}`}</td>
                  <td><StatusBadge status={booking.status} /></td>
                  {user?.role !== "usuario" && (
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => openEditForm(booking)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => openDeleteModal(booking.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </section>
    </div>
  );
}