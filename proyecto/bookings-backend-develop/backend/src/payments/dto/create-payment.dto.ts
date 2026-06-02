import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsPositive, IsString } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 1, description: 'ID del cliente' })
  @IsInt()
  @IsPositive()
  customerId!: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.TARJETA })
  @IsEnum(PaymentMethod)
  metodo_pago!: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PAGADO })
  @IsEnum(PaymentStatus)
  estado!: PaymentStatus;

  @ApiProperty({ example: 1, description: 'ID del servicio (importe)' })
  @IsInt()
  @IsPositive()
  servicioId!: number;

  @ApiProperty({ example: '10:30', description: 'Hora de pago' })
  @IsString()
  hora_pago!: string;

  @ApiProperty({ example: 1, description: 'ID de la reserva asociada' })
  @IsInt()
  @IsPositive()
  appointmentId!: number;
}
