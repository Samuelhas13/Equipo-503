import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, IsString, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @ApiPropertyOptional({ example: 1, description: 'Id user' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  userId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Id customer' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  customerId?: number;

  @ApiProperty({ example: 1, description: 'Id Business (nombre)' })
  @IsInt()
  @IsPositive()
  businessId!: number;
<<<<<<< HEAD
  @ApiProperty({ example: 1, description: 'Id servicios' })
=======
  @ApiPropertyOptional({ example: 1, description: 'Id servicios' })
  @IsOptional()
>>>>>>> 8dc73afd94f9629077c87212a392aa6bc44640a9
  @IsInt()
  @IsPositive()
  serviceId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Id pago' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  paymentId?: number;

  @ApiProperty({ example: '2026-04-20 10:30', description: 'Hora de reserva' })
  @IsString()
  @IsNotEmpty()
  hora_reserva!: string;

  @ApiProperty({ example: 'pending', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: 'Corte + Peinado', required: false })
  @IsOptional()
  @IsString()
  serviceName?: string;
}