import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Appointment } from '../appointments/appointment.entity';
import { Customer } from '../customers/customer.entity';
import { Service } from '../services/service.entity';

export enum PaymentStatus {
  POR_COBRAR = 'por cobrar',
  PAGADO = 'pagado',
  CANCELADO = 'cancelado',
}

export enum PaymentMethod {
  TARJETA = 'tarjeta',
  EFECTIVO = 'efectivo',
}

@Entity('payments')
export class Payment {
  @ApiProperty({ description: 'ID del pago' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    type: () => Customer,
    description: 'Cliente que realiza el pago',
  })
  @ManyToOne(() => Customer, (customer) => customer.payments)
  customer: Customer;

  @ApiProperty({ enum: PaymentMethod, description: 'Método de pago' })
  @Column({
    type: 'varchar',
    enum: PaymentMethod,
  })
  metodo_pago: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus, description: 'Estado del pago' })
  @Column({
    type: 'varchar',
    enum: PaymentStatus,
    default: PaymentStatus.POR_COBRAR,
  })
  estado: PaymentStatus;

  @ApiProperty({
    type: () => Service,
    description: 'Servicio pagado (importe)',
  })
  @ManyToOne(() => Service)
  servicio: Service;

  @ApiProperty({ description: 'Hora de pago' })
  @Column()
  hora_pago: string;

  @ApiProperty({ type: () => Appointment, description: 'Reserva asociada' })
  @OneToOne(() => Appointment, (appointment) => appointment.payment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  appointment: Appointment;
}
