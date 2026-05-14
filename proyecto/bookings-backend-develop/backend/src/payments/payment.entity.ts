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

export enum PaymentStatus {
  PAID = 'paid',
  PENDING = 'pending',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CARD = 'card',
  CASH = 'cash',
  BIZUM = 'bizum',
  PENDING = 'pending',
}

/**
 * Entidad Payment.
 * Gestiona los cobros relacionados a las reservas.
 * Se relaciona OneToOne con Appointment y ManyToOne con Customer.
 */
@Entity()
export class Payment {
  @ApiProperty({ example: 1, description: 'ID del pago' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 28.5, description: 'Importe del pago' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ example: '2026-05-14', description: 'Fecha en que se realizó el pago' })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({ enum: PaymentStatus, description: 'Estado del pago' })
  @Column({
    type: 'text',
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod, description: 'Método de pago' })
  @Column({
    type: 'text',
    default: PaymentMethod.PENDING,
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 1, description: 'ID de la reserva asociada al pago' })
  @Column()
  appointmentId: number;

  @ApiProperty({ type: () => Appointment, description: 'Reserva asociada' })
  @OneToOne(() => Appointment, (appointment) => appointment.payment)
  @JoinColumn({ name: 'appointmentId' })
  appointment!: Appointment;

  // --- RELACIÓN CON CUSTOMER (N a 1) ---
  @ApiProperty({ example: 1, description: 'ID del cliente asociado al pago' })
  @Column()
  customerId: number;

  @ApiProperty({ type: () => Customer, description: 'Cliente asociado' })
  @ManyToOne(() => Customer, (customer) => customer.payments)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}
