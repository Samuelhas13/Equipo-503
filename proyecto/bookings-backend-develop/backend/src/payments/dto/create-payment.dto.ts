import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsPositive,
  IsString,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 28.0, description: 'Importe del pago en euros' })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: '2026-04-15', description: 'Fecha del pago' })
  @IsDateString()
  date: string;

  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
    description: 'Estado del cobro',
  })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CARD,
    description: 'Método de pago: card | cash | bizum | pending',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 'María López', description: 'Nombre del cliente' })
  @IsString()
  customerName: string;

  @ApiProperty({
    example: 'Peluquería Nova',
    description: 'Nombre del comercio',
  })
  @IsString()
  businessName: string;

  @ApiProperty({ example: 1, description: 'ID de la reserva asociada' })
  @IsInt()
  @IsPositive()
  appointmentId: number;
}
