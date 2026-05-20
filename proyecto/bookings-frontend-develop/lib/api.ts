export type BookingStatus = "pending" | "confirmed" | "paid";

export interface Booking {
  id: number;
  date: string;
  time: string;
  status: BookingStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
}

export interface CreateBookingDto {
  date: string;
  time: string;
  status: BookingStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
}

export interface UpdateBookingDto {
  date?: string;
  time?: string;
  status?: BookingStatus;
  customerId?: number;
  businessId?: number;
  serviceName?: string;
}
// Tipos relacionados con clientes.
// Se usan para conectar la página /customers con los endpoints del backend.
export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  business: string | null;
  nextBooking: string | null;
  createdAt: string;
}
// Datos necesarios para crear un cliente desde el frontend
export interface CreateCustomerDto {
  name: string;
  email: string;
  phone: string;
  business: string;
  nextBooking?: string;
}
// Datos que se pueden enviar al editar un cliente.
// Al usar Partial, todos los campos son opcionales.
export type UpdateCustomerDto = Partial<CreateCustomerDto>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function getAppointments(): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/appointments`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error al obtener las reservas");
  }

  return res.json();
}

export async function createAppointment(data: CreateBookingDto): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Error al crear la reserva");
  }

  return res.json();
}

export async function updateAppointment(
  id: number,
  data: UpdateBookingDto
): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Error al editar la reserva");
  }

  return res.json();
}

export async function deleteAppointment(
  id: number
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Error al eliminar la reserva");
  }

  return res.json();
}
// Obtiene todos los clientes desde el backend
export async function getCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_URL}/customers`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error al obtener los clientes");
  }

  return res.json();
}
// Crea un nuevo cliente enviando los datos al backend
export async function createCustomer(
  data: CreateCustomerDto
): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Error al crear el cliente");
  }

  return res.json();
}
// Actualiza un cliente existente usando su id
export async function updateCustomer(
  id: number,
  data: UpdateCustomerDto
): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Error al actualizar el cliente");
  }

  return res.json();
}
// Elimina un cliente existente usando su id
export async function deleteCustomer(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Error al eliminar el cliente");
  }

  return res.json();
}