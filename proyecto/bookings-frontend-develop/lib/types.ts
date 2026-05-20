export type AppointmentStatus = "pending" | "confirmed" | "paid";

export type Appointment = {
  id: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
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