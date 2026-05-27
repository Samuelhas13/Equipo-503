import type {
  Booking, BookingStatus, CreateBookingDto, UpdateBookingDto,
  Customer, CreateCustomerDto, UpdateCustomerDto,
  Payment, PaymentMethod, PaymentStatus, CreatePaymentDto,
} from "./types";

export type {
  Booking, BookingStatus, CreateBookingDto, UpdateBookingDto,
  Customer, CreateCustomerDto, UpdateCustomerDto,
  Payment, PaymentMethod, PaymentStatus, CreatePaymentDto,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bookflow_token");
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...extra };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: authHeaders(options.headers as Record<string, string>),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// ── APPOINTMENTS ────────────────────────────────────────────────

export async function getAppointments(): Promise<Booking[]> {
  return apiRequest<Booking[]>("/appointments", { cache: "no-store" });
}

export async function createAppointment(data: CreateBookingDto): Promise<Booking> {
  return apiRequest<Booking>("/appointments", { method: "POST", body: JSON.stringify(data) });
}

export async function updateAppointment(id: number, data: UpdateBookingDto): Promise<Booking> {
  return apiRequest<Booking>(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteAppointment(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/appointments/${id}`, { method: "DELETE" });
}

// ── CUSTOMERS ───────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  return apiRequest<Customer[]>("/customers", { cache: "no-store" });
}

export async function createCustomer(data: CreateCustomerDto): Promise<Customer> {
  return apiRequest<Customer>("/customers", { method: "POST", body: JSON.stringify(data) });
}

export async function updateCustomer(id: number, data: UpdateCustomerDto): Promise<Customer> {
  return apiRequest<Customer>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteCustomer(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/customers/${id}`, { method: "DELETE" });
}

// ── PAYMENTS ────────────────────────────────────────────────────

export async function getPayments(): Promise<Payment[]> {
  return apiRequest<Payment[]>("/payments", { cache: "no-store" });
}

export async function createPayment(data: CreatePaymentDto): Promise<Payment> {
  return apiRequest<Payment>("/payments", { method: "POST", body: JSON.stringify(data) });
}

export function getExportReportUrl(): string {
  const token = getToken();
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${API_URL}/appointments/export${query}`;
}