import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsPositive, IsString } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 1, description: 'id customer (para q te de el customer entero)' })
  @IsInt()
  @IsPositive()
  customerId!: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.TARJETA, description: 'Metodo de pago (con targata, efectivo)' })
  @IsEnum(PaymentMethod)
  metodo_pago!: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PAGADO, description: 'Estado del pago (por cobrar, pagado, cancelado)' })
  @IsEnum(PaymentStatus)
  estado!: PaymentStatus;

  @ApiProperty({ example: 1, description: 'Id servicio(importe)' })
  @IsInt()
  @IsPositive()
  servicioId!: number;

  @ApiProperty({ example: '10:30', description: 'Hora de pago' })
  @IsString()
  hora_pago!: string;

  @ApiProperty({ example: 1, description: 'Id de la reserva asociada' })
  @IsInt()
  @IsPositive()
  appointmentId!: number;
}