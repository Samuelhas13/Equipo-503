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
  serviceName?: string;
}

export type PaymentMethod = "card" | "cash" | "bizum" | "pending";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Payment {
  id: number;
  amount: number;
  date: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerId: number;
  appointmentId: number;
  customer?: {
    id: number;
    name: string;
  };
  appointment?: Booking;
}

export interface CreatePaymentDto {
  amount: number;
  date: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerId: number;
  appointmentId: number;
}

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

export async function getPayments(): Promise<Payment[]> {
  const res = await fetch(`${API_URL}/payments`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error al obtener los pagos");
  }

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