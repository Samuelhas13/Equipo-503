"use client";

import { useMemo, useState } from "react";
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
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const emptyForm: CreateBookingDto = {
    date: "",
    time: "",
    status: "pending",
    customerId: 1,
    businessId: 1,
    serviceName: "",
  };

  const [createForm, setCreateForm] = useState<CreateBookingDto>(emptyForm);     //guarda lo que escribes en el formulario de crear reserva.
  const [editForm, setEditForm] = useState<CreateBookingDto>(emptyForm);         //guarda lo que escribes en el formulario de editar reserva.

  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");   //Esto guarda qué filtro está seleccionado.
  const [loadingCreate, setLoadingCreate] = useState(false);                        //Sirven para saber si se está creando o editando una reserva.
  const [loadingEdit, setLoadingEdit] = useState(false);                            
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);  //Guarda el id de la reserva que se está eliminando en ese momento.
  const [successMessage, setSuccessMessage] = useState("");                         //Guardan los mensajes que se enseñan al usuario.
  const [errorMessage, setErrorMessage] = useState("");                             
  const [isCreateOpen, setIsCreateOpen] = useState(false);                          //Controla si el formulario de crear reserva está abierto o cerrado.
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);    //Guarda el id de la reserva que se está editando.
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);        //Guarda el id de la reserva que el usuario quiere eliminar.

  const filteredBookings = useMemo(() => {                                          //Esto crea la lista de reservas filtradas.
    if (statusFilter === "all") return bookings;
    return bookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter]);

  const totalCount = bookings.length;                                               // numero total de reservas
  const pendingCount = bookings.filter((b) => b.status === "pending").length;       // numero de reservas pendientes, la b es cada reserva individual, es una abreviatura de booking
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;   // reservas confirmadas
  const paidCount = bookings.filter((b) => b.status === "paid").length;             // numero reservas pagadas

  function updateCreateForm<K extends keyof CreateBookingDto>(                      // esta funcion sirve para actualizar un campo concreto del formulario de creacion
    key: K,                                                                         // la clave key solo puede ser uno de los campos de CreateBookingDto-
    value: CreateBookingDto[K]                                                      // -es para evitar que pongas campos inventados
  ) {                                                                               // value: CreateBookingDto[K] significa que el valor debe coincidir con el tipo del campo 
    setCreateForm((prev) => ({                                                      // -si un campo es numero no deberias pasarle texto
      ...prev,
      [key]: value,
    }));
  }

  function updateEditForm<K extends keyof CreateBookingDto>(                        // esta funcion hace lo mismo pero para el formulario de edicion
    key: K,
    value: CreateBookingDto[K]
  ) {
    setEditForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetCreateForm() {                                                      // estas dos funciones sirven para dejar los formularios como al principio
    setCreateForm(emptyForm);
  }

  function resetEditForm() {
    setEditForm(emptyForm);
  }

  function openCreateForm() {                                                      // esta funcion se ejecuta cuando pulsas nueva reserva
    setErrorMessage("");                                                           // borra mensajes de error
    setSuccessMessage("");                                                         // borra mensajes de éxito
    setEditingBookingId(null);                                                     // cancela cualquier edición activa
    setDeleteTargetId(null);                                                       // cancela cualquier eliminación pendiente
    resetEditForm();                                                               // limpia el formulario de edición
    setIsCreateOpen(true);                                                         // abre el formulario de crear
  }

  function closeCreateForm() {                                                     // se ejecuta cuando borras mensajes de error
    setErrorMessage("");                                                           // borra mensajes de error
    resetCreateForm();                                                             // limpia el formulario de crear
    setIsCreateOpen(false);                                                        // cierra el formulario
  }

  function openEditForm(booking: Booking) {                                        // Esta funcion controla editar reservas y abrir/cerrar el modal de eliminar
    setErrorMessage("");                                                           // booking: Booking Recibe como parámetro una reserva completa:
    setSuccessMessage("");
    setIsCreateOpen(false);                                                        // Cierra el formulario de crear reserva, por si estaba abierto.
    setDeleteTargetId(null);                                                       // Cierra o cancela cualquier intento de eliminar una reserva.
    setEditingBookingId(booking.id);                                               // Guarda el id de la reserva que se está editando.
    setEditForm({                                                                  // Esto rellena el formulario de edición con los datos actuales de la reserva.
      date: booking.date,
      time: booking.time,
      status: booking.status, 
      customerId: booking.customerId,
      businessId: booking.businessId,
      serviceName: booking.serviceName,
    });
  }

  function closeEditForm() {                                                      // sirve para cerrar el formulario de edición
    setErrorMessage("");
    setEditingBookingId(null);                                                    // indica que ya no se está editando ninguna reserva
    resetEditForm();
  }

  function openDeleteModal(id: number) {                                          // elimina el id de una reserva el recibe el id
    setErrorMessage("");                                                          // y normalmente provoca que se abra un modal de confirmación 
    setSuccessMessage("");
    setDeleteTargetId(id);
  }

  function closeDeleteModal() {                                                  // cierra el modal de eliminar
    setDeleteTargetId(null);
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {      // esta funcion se ejecuta cuando envias el formulario de crear reserva
    e.preventDefault();                                                         // evita que el formulario se recargue  cuando envias un formulario HTML
    setLoadingCreate(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const created = await createAppointment(createForm);                    // Mandara los datos al backend para crear una resrva--
      setBookings((prev) => [created, ...prev]);//pon la nueva reserva al principio     // --Si todo va bien el backend devuelve la reserva creada
      resetCreateForm();
      setIsCreateOpen(false);
      setSuccessMessage("Reserva creada correctamente.");
    } catch {
      setErrorMessage("No se pudo crear la reserva. Revisa los datos o el backend.");
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {    // edita una reserva existente
    e.preventDefault();

    if (!editingBookingId) return;                                // comprueba si hay una reserva seleccionada para editar, editBookingId guarda el id de la reserva-
                                                                  // si no hay ningun id la funcion se detiene con return
    setLoadingEdit(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload: UpdateBookingDto = {                         // el playload es el que se va a enviar al backend, contiene los nuevos datos
        date: editForm.date,
        time: editForm.time,
        status: editForm.status,
        customerId: editForm.customerId,
        businessId: editForm.businessId,
        serviceName: editForm.serviceName,
      };

      const updated = await updateAppointment(editingBookingId, payload);

      setBookings((prev) =>                                               // actualiza la lista de reservas que se ve en la pantalla
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

  async function confirmDelete() {                                           // esta funcion se ejecuta cuando se confirma que quiere eliminar una reserva 
    if (deleteTargetId === null) return;

    setDeletingBookingId(deleteTargetId);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await deleteAppointment(deleteTargetId);                             // llamada al backend para eliminar
      setBookings((prev) => prev.filter((booking) => booking.id !== deleteTargetId));

      if (editingBookingId === deleteTargetId) {                           // Si justo estabas editando la reserva que acabas de eliminar, se cierra el formulario de edición.
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
    <div className="page-stack">
      <section className="page-hero">
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
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nueva reserva</h3>
            <button type="button" className="secondary-btn" onClick={closeCreateForm}>
              Cancelar
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <input
                className="input"
                type="date"
                value={createForm.date}
                onChange={(e) => updateCreateForm("date", e.target.value)}
                required
              />
              <input
                className="input"
                type="time"
                value={createForm.time}
                onChange={(e) => updateCreateForm("time", e.target.value)}
                required
              />
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
              <input
                className="input"
                type="number"
                min={1}
                value={createForm.customerId}
                onChange={(e) =>
                  updateCreateForm("customerId", Number(e.target.value))
                }
                placeholder="Customer ID"
                required
              />
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
              <input
                className="input input--full"
                type="text"
                value={createForm.serviceName}
                onChange={(e) => updateCreateForm("serviceName", e.target.value)}
                placeholder="Servicio"
                required
              />
            </div>

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
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Editar reserva #{editingBookingId}</h3>
            <button type="button" className="secondary-btn" onClick={closeEditForm}>
              Cancelar
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <input
                className="input"
                type="date"
                value={editForm.date}
                onChange={(e) => updateEditForm("date", e.target.value)}
                required
              />
              <input
                className="input"
                type="time"
                value={editForm.time}
                onChange={(e) => updateEditForm("time", e.target.value)}
                required
              />
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
              <input
                className="input"
                type="number"
                min={1}
                value={editForm.customerId}
                onChange={(e) =>
                  updateEditForm("customerId", Number(e.target.value))
                }
                placeholder="Customer ID"
                required
              />
              <input
                className="input"
                type="number"
                min={1}
                value={editForm.businessId}
                onChange={(e) =>
                  updateEditForm("businessId", Number(e.target.value))
                }
                placeholder="Business ID"
                required
              />
              <input
                className="input input--full"
                type="text"
                value={editForm.serviceName}
                onChange={(e) => updateEditForm("serviceName", e.target.value)}
                placeholder="Servicio"
                required
              />
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

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Reservas registradas</h3>
          <div className="filter-row">
            <button type="button" className="filter-pill" onClick={() => setStatusFilter("all")}>Todas</button>
            <button type="button" className="filter-pill" onClick={() => setStatusFilter("pending")}>Pendientes</button>
            <button type="button" className="filter-pill" onClick={() => setStatusFilter("confirmed")}>Confirmadas</button>
            <button type="button" className="filter-pill" onClick={() => setStatusFilter("paid")}>Pagadas</button>
          </div>
        </div>

        {successMessage ? <div className="message-success" style={{ marginBottom: 12 }}>{successMessage}</div> : null}
        {errorMessage ? <div className="message-error" style={{ marginBottom: 12 }}>{errorMessage}</div> : null}

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Servicio</th>
              <th>Customer</th>
              <th>Business</th>
              <th>Estado</th>
              <th>Acciones</th>
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
                <td>{booking.businessId}</td>
                <td><StatusBadge status={booking.status} /></td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="secondary-btn" onClick={() => openEditForm(booking)}>
                      Editar
                    </button>
                    <button type="button" className="secondary-btn" onClick={() => openDeleteModal(booking.id)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}