import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsOptional,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  userId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  customerId?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  businessId!: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  serviceId?: number;

  @ApiProperty({ example: '2026-04-20 10:30' })
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

  @ApiProperty({ example: 'PREM-XYZ123', required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
