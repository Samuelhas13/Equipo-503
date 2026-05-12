import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
}

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column()
  time: string;

  @Column({
    type: 'text',
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column()
  customerId: number;

  @Column()
  businessId: number;

  @Column()
  serviceName: string;
}