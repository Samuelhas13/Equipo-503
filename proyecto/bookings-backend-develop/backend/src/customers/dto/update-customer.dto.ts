/**
 * UpdateCustomerDto.
 * Permite actualizar los campos de un cliente de forma parcial (todos los campos son opcionales).
 * Hereda de CreateCustomerDto para reusar las validaciones (ej. validar email si se envía).
 */
import { PartialType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) { }
