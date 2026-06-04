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

// Normaliza un appointment crudo del backend al tipo Booking del frontend.
// El backend devuelve relaciones anidadas (customer, business, service, user)
// como objetos completos. Extraemos los campos útiles para el frontend.
function normalizeBooking(app: any): Booking {
  const parts = (app.hora_reserva || "").split(" ");
  const date = parts[0] || "";
  const time = parts[1] || "";

  // Extraer IDs desde el campo directo o desde el objeto anidado
  const customerId: number | undefined =
    app.customerId ?? (app.customer ? app.customer.id : undefined);
  const businessId: number | undefined =
    app.businessId ?? (app.business ? app.business.id : undefined);

  // Extraer nombres reales para mostrar en la UI (dashboard, tabla de reservas)
  const customerName: string =
    app.customer
      ? `${app.customer.nombre || ""} ${app.customer.apellido || ""}`.trim() ||
        app.customer.email ||
        String(app.customer.id)
      : app.user
        ? `${app.user.nombre || ""} ${app.user.apellido || ""}`.trim() ||
          app.user.email ||
          String(app.user.id)
        : "";

  const businessName: string =
    app.business ? app.business.nombre || String(app.business.id) : "";

  return {
    id: app.id,
    hora_reserva: app.hora_reserva || `${date} ${time}`.trim(),
    date,
    time,
    status: app.status || "pending",
    // Preservamos los IDs (pueden ser undefined si el backend no los devuelve)
    customerId,
    businessId,
    userId: app.userId ?? (app.user ? app.user.id : undefined),
    // Nombre del servicio: del campo normalizado o del objeto anidado
    serviceName: app.serviceName || (app.service ? app.service.nombre : ""),
    // Nombres extra para la UI (no son parte del tipo Booking oficial pero
    // los adjuntamos dinámicamente para no hacer peticiones adicionales)
    ...(customerName && { customerName } as any),
    ...(businessName && { businessName } as any),
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  };
}

// Obtiene todas las citas del usuario autenticado.
// Pedimos limit=1000 para evitar que la paginación del backend
// corte los resultados (por defecto el backend devuelve sólo 10).
export async function getAppointments(): Promise<Booking[]> {
  const apps = await apiRequest<any[]>("/appointments?page=1&limit=1000", { cache: "no-store" });
  return apps.map(normalizeBooking);
}

// NUEVO: Obtiene citas filtradas por rango de fechas enviando los parámetros
// `from` y `to` (formato YYYY-MM-DD) como query params al backend.
// Si el backend aún no soporta esos parámetros, el bloque catch hace fallback:
// trae todas las citas (hasta 1000) y filtra en cliente para no romper la app.
export async function getAppointmentsByRange(
  from: string,
  to: string
): Promise<Booking[]> {
  try {
    const apps = await apiRequest<any[]>(
      `/appointments?page=1&limit=1000&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { cache: "no-store" }
    );
    return apps.map(normalizeBooking);
  } catch {
    // Fallback cliente: si el backend no filtra por rango, descargamos todo y acotamos aquí.
    const all = await getAppointments();
    return all.filter((b) => {
      const d = b.date ?? "";
      return d >= from && d <= to;
    });
  }
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

// El backend devuelve clientes con campos en español (nombre, apellido, numero).
// Este helper mapea esos campos a los alias de conveniencia del frontend
// (name, phone) que usan los componentes CustomerCard y BookingsClient.
function normalizeCustomer(c: any): Customer {
  return {
    ...c,
    // Alias para CustomerCard y otros componentes del frontend
    name: c.name || `${c.nombre || ""} ${c.apellido || ""}`.trim() || c.email || "",
    phone: c.phone || c.numero || "",
  };
}

export async function getCustomers(): Promise<Customer[]> {
  const data = await apiRequest<any[]>("/customers", { cache: "no-store" });
  // Normalizamos para que los campos nombre/apellido queden mapeados a name/phone
  return data.map(normalizeCustomer);
}

export async function getCustomerById(id: number): Promise<Customer> {
  const c = await apiRequest<any>(`/customers/${id}`, { cache: "no-store" });
  return normalizeCustomer(c);
}

// MEJORA INNOVADORA: Búsqueda de cliente por nombre con autocomplete
// Retorna una lista de clientes que coincidan parcialmente con el nombre
export async function searchCustomersByName(name: string): Promise<Customer[]> {
  if (!name || name.trim().length < 2) return [];
  try {
    return apiRequest<Customer[]>(`/customers?search=${encodeURIComponent(name)}`, { cache: "no-store" });
  } catch {
    // Si el endpoint de búsqueda no existe, fallback: obtener todos y filtrar en cliente
    const allCustomers = await getCustomers();
    const searchLower = name.toLowerCase();
    return allCustomers.filter((c) => {
      const fullName = `${c.nombre || ''} ${c.apellido || ''}`.toLowerCase();
      return fullName.includes(searchLower) || (c.email || '').toLowerCase().includes(searchLower);
    });
  }
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

// ── AUTH ──────────────────────────────────────────────────────────

// Registro público de nuevos usuarios (rol customer por defecto en el backend)
export async function registerUser(data: any): Promise<any> {
  return apiRequest<any>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

