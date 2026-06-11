// Sincronizado con AppointmentStatus del backend (appointment.entity.ts)
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "paid"
  | "canceled"
  | "completed";

// Minimal Service type coming from backend
export interface Service {
  id: number;
  nombre: string;
  precio?: number;
  date?: string;
  time?: string;
  status?: BookingStatus;
  customerId?: number;
  businessId?: number;
  userId?: number;
  serviceName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Minimal Business type
export interface Business {
  id: number;
  nombre: string;
  direccion: string;
}

export interface Booking {
  id: number;
  // backend field: hora_reserva contains date+time like '2026-04-20 10:30' or '10:30'
  hora_reserva: string;
  user?: unknown;
  customer?: Customer | number;
  business?: Business | number;
  service?: Service | number;
  payment?: Payment | number;
  createdAt?: string;
  updatedAt?: string;
  // Convenience / legacy frontend fields (mapped from backend)
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM or time portion
  serviceName?: string;
  customerId?: number;
  businessId?: number;
  userId?: number;
  status?: BookingStatus | string;
}

// CreateAppointmentDto shape expected by backend
export interface CreateBookingDto {
  userId?: number;
  customerId?: number;
  businessId?: number;
  serviceId?: number;
  hora_reserva?: string;
  // Accept legacy frontend props
  date?: string;
  time?: string;
  serviceName?: string;
  status?: BookingStatus | string;
}

export interface UpdateBookingDto {
  userId?: number;
  customerId?: number;
  businessId?: number;
  serviceId?: number;
  hora_reserva?: string;
  date?: string;
  time?: string;
  status?: BookingStatus | string;
  serviceName?: string;
}

// Tipo que representa un cliente tal y como llega desde el backend
export interface Customer {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  numero: string;
  business?: Business | number | null;
  appointments?: Booking[];
  payments?: Payment[];
  puntos?: number;
  redemptions?: RewardRedemption[];
  // convenience fields used in frontend
  name?: string;
  phone?: string;
  nextBooking?: string | Booking;
}

export type CreateCustomerDto = {
  nombre?: string;
  apellido?: string;
  email?: string;
  numero?: string;
  businessId?: number;
  // accept legacy frontend names
  name?: string;
  phone?: string;
  nextBooking?: string;
};

export type UpdateCustomerDto = Partial<CreateCustomerDto>;

// Estados posibles de un pago según el backend
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

// Métodos de pago posibles según el backend
export type PaymentMethod = "card" | "cash" | "bizum" | "pending";

// Tipo que representa un pago tal y como llega desde el backend
export interface Payment {
  id: number;
  customer?: Customer | number;
  metodo_pago: PaymentMethod | string;
  estado: PaymentStatus | string;
  servicio?: Service | number;
  hora_pago: string;
  appointment?: Booking | number;
  // convenience aliases for frontend
  amount?: number;
  paymentMethod?: PaymentMethod | string;
  status?: PaymentStatus | string;
  appointmentId?: number;
  createdAt?: string;
}

export type CreatePaymentDto = {
  customerId: number;
  metodo_pago?: PaymentMethod | string;
  estado?: PaymentStatus | string;
  servicioId?: number;
  hora_pago?: string;
  appointmentId: number;
  // legacy frontend fields
  amount?: number;
  paymentMethod?: PaymentMethod | string;
  status?: PaymentStatus | string;
  date?: string;
};

export type UpdatePaymentDto = Partial<CreatePaymentDto>;


export type CreateBusinessDto = {
  nombre: string;
  direccion: string;
};

export type UpdateBusinessDto = Partial<CreateBusinessDto>;

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: "support" | "billing" | "sales" | "other";
  message: string;
  isRead: boolean;
  replyMessage?: string;
  createdAt: string;
}

export interface CreateContactDto {
  name: string;
  email: string;
  subject: "support" | "billing" | "sales" | "other";
  message: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Reward {
  id: number;
  title: string;
  description?: string;
  type: "discount" | "gift";
  discountValue?: number;
  requiredPoints: number;
  isActive: boolean;
  business?: Business | number;
}

export interface RewardRedemption {
  id: number;
  customer?: Customer | number;
  reward?: Reward | number;
  redeemedAt: string;
  status: "pending" | "used";
  code: string;
}



