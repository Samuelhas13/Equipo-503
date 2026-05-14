/**
 * Entidad Appointment.
 * Define el esquema de la tabla de reservas en la base de datos usando TypeORM.
 * Representa una cita de un cliente para un servicio en un negocio específico.
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  CANCELED = 'canceled',
  COMPLETED = 'completed',
}

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string; // Se mantiene en string por compatibilidad con el front, pero podría parsearse a Date en el futuro

  @Column()
  time: string;

  @Column({
    type: 'text',
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  // En una arquitectura completa esto sería @ManyToOne(() => Customer)
  @Column()
  customerId: number;

  // En una arquitectura completa esto sería @ManyToOne(() => Business)
  @Column()
  businessId: number;

  @Column()
  serviceName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}