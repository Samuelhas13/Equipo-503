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
<<<<<<< HEAD
};
// Tipo que representa un cliente tal y como llega desde el backend
export type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  business: string | null;
  nextBooking: string | null;
  createdAt: string;
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
=======
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
>>>>>>> merge
