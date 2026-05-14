/**
 * UpdateAppointmentDto.
 * Define los datos permitidos al actualizar una reserva existente.
 * Omitimos 'customerId' y 'businessId' para evitar que se reasigne la reserva.
 */
import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAppointmentDto } from './create-appointment.dto';

export class UpdateAppointmentDto extends PartialType(
  OmitType(CreateAppointmentDto, ['customerId', 'businessId'] as const),
) {}