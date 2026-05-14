import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';

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

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'text',
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'text',
    default: PaymentMethod.PENDING,
  })
  paymentMethod: PaymentMethod;

  @Column()
  customerName: string;

  @Column()
  businessName: string;

  @Column()
  appointmentId: number;

  @OneToOne(() => Appointment)
  @JoinColumn({ name: 'appointmentId' })
  appointment!: Appointment;
}
