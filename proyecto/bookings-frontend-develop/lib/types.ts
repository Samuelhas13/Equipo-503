// Sincronizado con AppointmentStatus del backend (appointment.entity.ts)
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "paid"
  | "canceled"
  | "completed";

export interface Booking {
  id: number;
  date: string;
  time: string;
  status: BookingStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookingDto {
  date: string;
  time: string;
  status?: BookingStatus;
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

// Tipo que representa un cliente tal y como llega desde el backend
export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  business: string | null;
  nextBooking?: string | null;
  createdAt?: string;
}

// Tipo de datos que se envían al backend para crear un cliente nuevo
export type CreateCustomerDto = {
  name: string;
  email: string;
  phone: string;
  business: string;
  nextBooking?: string;
};

// Tipo de datos para actualizar un cliente.
// Partial permite enviar solo los campos que se quieran modificar.
export type UpdateCustomerDto = Partial<CreateCustomerDto>;

// Estados posibles de un pago según el backend
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

// Métodos de pago posibles según el backend
export type PaymentMethod = "card" | "cash" | "bizum" | "pending";

// Tipo que representa un pago tal y como llega desde el backend
export interface Payment {
  id: number;
  amount: number;
  date: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  appointmentId: number;
  customerId: number;
  createdAt?: string;
  appointment?: Booking;
}

// Datos necesarios para crear un nuevo pago
export type CreatePaymentDto = {
  amount: number;
  date: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerId: number;
  appointmentId: number;
};

// Datos para actualizar un pago.
// Partial permite enviar solo los campos que se quieran modificar.
export type UpdatePaymentDto = Partial<CreatePaymentDto>;

export interface Business {
  id: number;
  nombre: string;
  direccion: string;
}

export type CreateBusinessDto = {
  nombre: string;
  direccion: string;
};

export type UpdateBusinessDto = Partial<CreateBusinessDto>;

