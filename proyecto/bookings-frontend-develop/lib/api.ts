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
  Business,
  CreateBusinessDto,
  UpdateBusinessDto,
} from "./types";

export type { Booking, BookingStatus, PaymentMethod, PaymentStatus };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type BackendCustomer = {
  id: number;
  nombre?: string;
  apellido?: string;
  name?: string;
  email?: string;
  numero?: string;
  phone?: string;
  business?: { nombre?: string; name?: string } | string | null;
  nextBooking?: string | null;
  createdAt?: string;
};

type BackendCreateCustomerDto = {
  nombre: string;
  apellido: string;
  email: string;
  numero: string;
};

type BackendUpdateCustomerDto = Partial<BackendCreateCustomerDto>;

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

function normalizeCustomer(customer: BackendCustomer): Customer {
  const fullName = [customer.nombre, customer.apellido].filter(Boolean).join(" ").trim();
  const business =
    typeof customer.business === "string"
      ? customer.business
      : customer.business?.nombre || customer.business?.name || null;

  return {
    id: customer.id,
    name: customer.name || fullName || customer.email || "Cliente",
    email: customer.email || "",
    phone: customer.phone || customer.numero || "",
    business,
    nextBooking: customer.nextBooking ?? null,
    createdAt: customer.createdAt,
  };
}

function splitCustomerName(name: string): Pick<BackendCreateCustomerDto, "nombre" | "apellido"> {
  const [firstName, ...lastNameParts] = name.trim().split(/\s+/);

  return {
    nombre: firstName || name.trim(),
    apellido: lastNameParts.join(" ") || "-",
  };
}

function toBackendCustomerDto(data: CreateCustomerDto): BackendCreateCustomerDto {
  return {
    ...splitCustomerName(data.name),
    email: data.email,
    numero: data.phone.replace(/\s+/g, ""),
  };
}

function toBackendCustomerUpdateDto(data: UpdateCustomerDto): BackendUpdateCustomerDto {
  return {
    ...(data.name ? splitCustomerName(data.name) : {}),
    ...(data.email ? { email: data.email } : {}),
    ...(data.phone ? { numero: data.phone.replace(/\s+/g, "") } : {}),
  };
}

// ── APPOINTMENTS ────────────────────────────────────────────────

function normalizeBooking(app: any): Booking {
  const parts = (app.hora_reserva || "").split(" ");
  const date = parts[0] || "";
  const time = parts[1] || "";

  return {
    id: app.id,
    date,
    time,
    status: app.status || "pending",
    customerId: app.customerId || (app.customer ? app.customer.id : 1),
    businessId: app.businessId || (app.business ? app.business.id : 1),
    userId: app.userId || (app.user ? app.user.id : undefined),
    serviceName: app.serviceName || (app.service ? app.service.nombre : ""),
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  };
}

export async function getAppointments(): Promise<Booking[]> {
  const apps = await apiRequest<any[]>("/appointments", { cache: "no-store" });
  return apps.map(normalizeBooking);
}

export async function createAppointment(data: CreateBookingDto): Promise<Booking> {
  const { date, time, ...rest } = data;
  const body = {
    ...rest,
    hora_reserva: `${date} ${time}`,
  };
  const created = await apiRequest<any>("/appointments", { method: "POST", body: JSON.stringify(body) });
  return normalizeBooking(created);
}

export async function updateAppointment(id: number, data: UpdateBookingDto): Promise<Booking> {
  const { date, time, ...rest } = data;
  const body: any = { ...rest };
  if (date || time) {
    body.hora_reserva = `${date} ${time}`;
  }
  const updated = await apiRequest<any>(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return normalizeBooking(updated);
}

export async function deleteAppointment(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/appointments/${id}`, { method: "DELETE" });
}

// ── CUSTOMERS ───────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  const customers = await apiRequest<BackendCustomer[]>("/customers", { cache: "no-store" });
  return customers.map(normalizeCustomer);
}

export async function createCustomer(data: CreateCustomerDto): Promise<Customer> {
  const customer = await apiRequest<BackendCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(toBackendCustomerDto(data)),
  });
  return normalizeCustomer(customer);
}

export async function updateCustomer(id: number, data: UpdateCustomerDto): Promise<Customer> {
  const customer = await apiRequest<BackendCustomer>(`/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toBackendCustomerUpdateDto(data)),
  });
  return normalizeCustomer(customer);
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

// ── BUSINESSES ───────────────────────────────────────────────────

export async function getBusinesses(): Promise<Business[]> {
  return apiRequest<Business[]>("/business", { cache: "no-store" });
}

export async function createBusiness(data: CreateBusinessDto): Promise<Business> {
  return apiRequest<Business>("/business", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBusiness(id: number, data: UpdateBusinessDto): Promise<Business> {
  return apiRequest<Business>(`/business/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteBusiness(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/business/${id}`, {
    method: "DELETE",
  });
}

