import type {
  Booking,
  BookingStatus,
  CreateBookingDto,
  UpdateBookingDto,
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  Payment,
  PaymentMethod,
  PaymentStatus,
  CreatePaymentDto,
} from "./types";

export type {
  Booking,
  BookingStatus,
  CreateBookingDto,
  UpdateBookingDto,
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  Payment,
  PaymentMethod,
  PaymentStatus,
  CreatePaymentDto,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ─── APPOINTMENTS ──────────────────────────────────────────────

export async function getAppointments(): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/appointments`, { cache: "no-store" });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error ${res.status}: ${errorText}`);
  }
  return res.json();
}

export async function createAppointment(data: CreateBookingDto): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear la reserva");
  return res.json();
}

export async function updateAppointment(id: number, data: UpdateBookingDto): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al editar la reserva");
  return res.json();
}

export async function deleteAppointment(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/appointments/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar la reserva");
  return res.json();
}

// ─── CUSTOMERS ────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_URL}/customers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener los clientes");
  return res.json();
}

export async function createCustomer(
  data: CreateCustomerDto
): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear el cliente");
  return res.json();
}

// ─── PAYMENTS ─────────────────────────────────────────────────

export async function getPayments(): Promise<Payment[]> {
  const res = await fetch(`${API_URL}/payments`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener los pagos");
  return res.json();
}

export async function createPayment(data: CreatePaymentDto): Promise<Payment> {
  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message = errorData?.message || "Error al crear el pago";
    throw new Error(message);
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

export function getExportReportUrl(): string {
  return `${API_URL}/appointments/export`;
}