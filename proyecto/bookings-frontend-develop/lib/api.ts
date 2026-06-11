/* eslint-disable @typescript-eslint/no-explicit-any */
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
  ContactMessage,
  CreateContactDto,
  Notification,
  Service,
  Reward,
  RewardRedemption,
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
  Reward,
  RewardRedemption,
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

function normalizeBooking(app: any): Booking {
  const parts = (app.hora_reserva || "").split(" ");
  const date = parts[0] || "";
  const time = parts[1] || "";

  return {
    id: app.id,
    hora_reserva: app.hora_reserva || "",
    date,
    time,
    status: app.status || "pending",
    customerId: app.customerId || (app.customer ? app.customer.id : 1),
    businessId: app.businessId || (app.business ? app.business.id : 1),
    userId: app.userId || (app.user ? app.user.id : undefined),
    serviceName: app.serviceName || (app.service ? app.service.nombre : ""),
    couponCode: app.couponCode || undefined,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    service: app.service,
  };
}

export async function getAppointments(): Promise<Booking[]> {
  const apps = await apiRequest<any[]>("/appointments", { cache: "no-store" });
  return apps.map(normalizeBooking);
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
  if (data.couponCode) payload.couponCode = data.couponCode;

  return apiRequest<Booking>("/appointments", { method: "POST", body: JSON.stringify(payload) });
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

function normalizePayment(pay: any): Payment {
  let amount = 0;
  if (pay.servicio && typeof pay.servicio === "object") {
    amount = pay.servicio.precio || 0;
  }
  
  let appointmentId = undefined;
  if (pay.appointment && typeof pay.appointment === "object") {
    appointmentId = pay.appointment.id;
  } else if (typeof pay.appointment === "number") {
    appointmentId = pay.appointment;
  }

  let status = pay.estado || "pending";
  if (status === "pagado") status = "paid";
  else if (status === "por cobrar") status = "pending";
  else if (status === "cancelado") status = "failed";

  let paymentMethod = pay.metodo_pago || "pending";
  if (paymentMethod === "tarjeta") paymentMethod = "card";
  else if (paymentMethod === "efectivo") paymentMethod = "cash";

  return {
    ...pay,
    amount,
    status,
    paymentMethod,
    appointmentId,
    createdAt: pay.hora_pago || pay.createdAt,
  };
}

export async function getPayments(): Promise<Payment[]> {
  const payments = await apiRequest<any[]>("/payments", { cache: "no-store" });
  return payments.map(normalizePayment);
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

// ── CONTACT MESSAGES ─────────────────────────────────────────────

export async function submitContactMessage(data: CreateContactDto): Promise<ContactMessage> {
  return apiRequest<ContactMessage>("/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  return apiRequest<ContactMessage[]>("/contact", { cache: "no-store" });
}

export async function getUnreadContactMessagesCount(): Promise<{ count: number }> {
  return apiRequest<{ count: number }>("/contact/unread-count", { cache: "no-store" });
}

export async function updateContactMessageReadStatus(id: number, isRead: boolean): Promise<ContactMessage> {
  return apiRequest<ContactMessage>(`/contact/${id}/read`, {
    method: "PATCH",
    body: JSON.stringify({ isRead }),
  });
}

export async function deleteContactMessage(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/contact/${id}`, {
    method: "DELETE",
  });
}

// ── NOTIFICATIONS ──────────────────────────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  return apiRequest<Notification[]>("/notifications", { cache: "no-store" });
}

export async function markNotificationAsRead(id: number): Promise<Notification> {
  return apiRequest<Notification>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function deleteNotification(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/notifications/${id}`, {
    method: "DELETE",
  });
}

export async function replyToContactMessage(id: number, replyMessage: string): Promise<ContactMessage> {
  return apiRequest<ContactMessage>(`/contact/${id}/reply`, {
    method: "POST",
    body: JSON.stringify({ replyMessage }),
  });
}

// ── SERVICES ───────────────────────────────────────────────────

export async function getServices(): Promise<Service[]> {
  return apiRequest<Service[]>("/services", { cache: "no-store" });
}

export async function createService(data: { nombre: string; precio: number; businessId?: number }): Promise<Service> {
  return apiRequest<Service>("/services", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateService(id: number, data: { nombre?: string; precio?: number; businessId?: number }): Promise<Service> {
  return apiRequest<Service>(`/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteService(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/services/${id}`, {
    method: "DELETE",
  });
}

// ── USERS ───────────────────────────────────────────────────────

export async function getUserById(id: number): Promise<any> {
  return apiRequest<any>(`/users/${id}`, { cache: "no-store" });
}

export async function updateUser(id: number, data: any): Promise<any> {
  return apiRequest<any>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── REWARDS ──────────────────────────────────────────────────────

export async function getRewards(businessId?: number): Promise<Reward[]> {
  const query = businessId ? `?businessId=${businessId}` : "";
  return apiRequest<Reward[]>(`/rewards${query}`, { cache: "no-store" });
}

export async function getRewardById(id: number): Promise<Reward> {
  return apiRequest<Reward>(`/rewards/${id}`, { cache: "no-store" });
}

export async function createReward(data: {
  title: string;
  description?: string;
  type: "discount" | "gift";
  discountValue?: number;
  requiredPoints: number;
  businessId?: number;
}): Promise<Reward> {
  return apiRequest<Reward>("/rewards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateReward(id: number, data: Partial<Reward>): Promise<Reward> {
  return apiRequest<Reward>(`/rewards/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteReward(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/rewards/${id}`, {
    method: "DELETE",
  });
}

export async function claimReward(rewardId: number): Promise<RewardRedemption> {
  return apiRequest<RewardRedemption>(`/rewards/claim/${rewardId}`, {
    method: "POST",
  });
}

export async function getMyRedemptions(): Promise<RewardRedemption[]> {
  return apiRequest<RewardRedemption[]>("/rewards/my-redemptions", { cache: "no-store" });
}

export async function getBusinessRedemptions(): Promise<RewardRedemption[]> {
  return apiRequest<RewardRedemption[]>("/rewards/business-redemptions", { cache: "no-store" });
}

export async function validateRedemptionCode(code: string): Promise<RewardRedemption> {
  return apiRequest<RewardRedemption>("/rewards/validate", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function getMyPoints(): Promise<{ points: number }> {
  return apiRequest<{ points: number }>("/rewards/my-points", { cache: "no-store" });
}

