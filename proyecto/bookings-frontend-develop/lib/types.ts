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

// Customer — basado en la entidad Customer del backend
export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  business?: string;
  createdAt?: string;
}

// Payment — basado en la entidad Payment del backend
export interface Payment {
  id: number;
  amount: number;
  method: string;
  status: "pending" | "paid";
  appointmentId: number;
  createdAt?: string;
  appointment?: Booking;
}