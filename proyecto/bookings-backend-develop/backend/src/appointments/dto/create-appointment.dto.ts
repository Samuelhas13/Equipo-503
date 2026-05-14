/**
 * CreateAppointmentDto.
 * Define la estructura de datos requerida para crear una nueva reserva.
 * Utiliza validadores de class-validator para asegurar la integridad de los datos.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsString, Matches } from 'class-validator';
import { AppointmentStatus } from '../appointment.entity';

export class CreateAppointmentDto {
  @ApiProperty({ example: '2026-04-20' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '10:30' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'time must be in HH:mm format',
  })
  time: string;

  @ApiProperty({
    enum: AppointmentStatus,
    example: AppointmentStatus.PENDING,
  })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiProperty({ example: 1 })
  @IsInt()
  customerId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  businessId: number;

  @ApiProperty({ example: 'Corte de pelo' })
  @IsString()
  serviceName: string;
}