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
};

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

  if (res.status === 401) {
    throw new Error("No has iniciado sesión.");
  }

  if (res.status === 403) {
    throw new Error(
      body?.message ||
      "No tienes permisos para acceder a este recurso."
    );
  }

  throw new Error(
    body?.message || `Error ${res.status}: ${res.statusText}`
  );
}
  return res.json();
}

// ── APPOINTMENTS ────────────────────────────────────────────────

export async function getAppointments(): Promise<Booking[]> {
  return apiRequest<Booking[]>("/appointments", { cache: "no-store" });
}

export async function createAppointment(data: CreateBookingDto): Promise<Booking> {
  // Normalize possible frontend shapes to backend CreateAppointmentDto
  const payload: any = {};
  // hora_reserva: accept explicit or build from date+time
  if ((data as any).hora_reserva) payload.hora_reserva = (data as any).hora_reserva;
  else if ((data as any).date && (data as any).time) payload.hora_reserva = `${(data as any).date} ${(data as any).time}`;
  // ids
  if ((data as any).userId) payload.userId = (data as any).userId;
  if ((data as any).customerId) payload.customerId = (data as any).customerId;
  if ((data as any).businessId) payload.businessId = (data as any).businessId;
  if ((data as any).serviceId) payload.serviceId = (data as any).serviceId;
  // fallback: if service provided as object or name, try to use id property
  if (!payload.serviceId && (data as any).service) payload.serviceId = (data as any).service?.id || undefined;

  return apiRequest<Booking>("/appointments", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateAppointment(id: number, data: UpdateBookingDto): Promise<Booking> {
  const payload: any = {};
  if ((data as any).hora_reserva) payload.hora_reserva = (data as any).hora_reserva;
  else if ((data as any).date && (data as any).time) payload.hora_reserva = `${(data as any).date} ${(data as any).time}`;
  if ((data as any).userId) payload.userId = (data as any).userId;
  if ((data as any).customerId) payload.customerId = (data as any).customerId;
  if ((data as any).businessId) payload.businessId = (data as any).businessId;
  if ((data as any).serviceId) payload.serviceId = (data as any).serviceId;
  if (!payload.serviceId && (data as any).service) payload.serviceId = (data as any).service?.id || undefined;

  return apiRequest<Booking>(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteAppointment(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/appointments/${id}`, { method: "DELETE" });
}

// ── CUSTOMERS ───────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  return apiRequest<Customer[]>("/customers", { cache: "no-store" });
}

export async function getCustomerById(id: number): Promise<Customer> {
  return apiRequest<Customer>(`/customers/${id}`, { cache: "no-store" });
}

export async function createCustomer(data: CreateCustomerDto): Promise<Customer> {
  // Accept both english fields and backend spanish fields
  const payload: any = {};
  payload.nombre = (data as any).nombre || (data as any).name || '';
  payload.apellido = (data as any).apellido || (data as any).lastName || '';
  payload.email = (data as any).email;
  payload.numero = (data as any).numero || (data as any).phone || (data as any).telefono || '';
  if ((data as any).businessId) payload.businessId = (data as any).businessId;

  return apiRequest<Customer>("/customers", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateCustomer(id: number, data: UpdateCustomerDto): Promise<Customer> {
  const payload: any = {};
  if ((data as any).nombre || (data as any).name) payload.nombre = (data as any).nombre || (data as any).name;
  if ((data as any).apellido || (data as any).lastName) payload.apellido = (data as any).apellido || (data as any).lastName;
  if ((data as any).email) payload.email = (data as any).email;
  if ((data as any).numero || (data as any).phone) payload.numero = (data as any).numero || (data as any).phone;
  if ((data as any).businessId) payload.businessId = (data as any).businessId;

  return apiRequest<Customer>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteCustomer(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/customers/${id}`, { method: "DELETE" });
}

// ── PAYMENTS ────────────────────────────────────────────────────

export async function getPayments(): Promise<Payment[]> {
  return apiRequest<Payment[]>("/payments", { cache: "no-store" });
}

export async function createPayment(data: CreatePaymentDto): Promise<Payment> {
  // Normalize english fields to backend DTO names
  const payload: any = {};
  payload.customerId = (data as any).customerId || (data as any).customer || (data as any).customerId;
  // metodo_pago mapping
  const method = (data as any).metodo_pago || (data as any).paymentMethod;
  if (method) {
    if (method === 'card' || method === 'tarjeta') payload.metodo_pago = 'tarjeta';
    else if (method === 'cash' || method === 'efectivo') payload.metodo_pago = 'efectivo';
    else payload.metodo_pago = method;
  }
  // estado mapping
  const estado = (data as any).estado || (data as any).status;
  if (estado) {
    if (estado === 'paid' || estado === 'pagado') payload.estado = 'pagado';
    else if (estado === 'pending' || estado === 'por cobrar') payload.estado = 'por cobrar';
    else if (estado === 'failed' || estado === 'cancelado') payload.estado = 'cancelado';
    else payload.estado = estado;
  }
  payload.servicioId = (data as any).servicioId || (data as any).servicio || (data as any).serviceId;
  payload.hora_pago = (data as any).hora_pago || (data as any).horaPago || (data as any).date || (data as any).time || '';
  payload.appointmentId = (data as any).appointmentId || (data as any).appointment || (data as any).appointmentId;

  return apiRequest<Payment>("/payments", { method: "POST", body: JSON.stringify(payload) });
}

export function getExportReportUrl(): string {
  const token = getToken();
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${API_URL}/appointments/export${query}`;}