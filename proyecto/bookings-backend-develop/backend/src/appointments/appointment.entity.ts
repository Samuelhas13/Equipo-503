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
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Customer } from '../customers/customer.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  CANCELED = 'canceled',
  COMPLETED = 'completed',
}

@Entity()
export class Appointment {
  @ApiProperty({ example: 1, description: 'Identificador de la reserva' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: '2026-04-20', description: 'Fecha de la reserva' })
  @Column({ type: 'date' })
  date: string; // Se mantiene en string por compatibilidad con el front, pero podría parsearse a Date en el futuro

  @ApiProperty({ example: '10:30', description: 'Hora de la reserva' })
  @Column()
  time: string;

  @ApiProperty({ enum: AppointmentStatus, default: AppointmentStatus.PENDING, description: 'Estado actual de la reserva' })
  @Column({
    type: 'text',
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @ApiProperty({ type: () => Customer, description: 'Cliente asociado a la reserva' })
  @ManyToOne(() => Customer, (customer) => customer.appointments)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ApiProperty({ example: 1, description: 'ID del cliente' })
  @Column()
  customerId: number;

  // En una arquitectura completa esto sería @ManyToOne(() => Business)
  @ApiProperty({ example: 1, description: 'ID del negocio' })
  @Column()
  businessId: number;

  @ApiProperty({ example: 'Corte de pelo', description: 'Nombre del servicio reservado' })
  @Column()
  serviceName: string;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Fecha de eliminación lógica' })
  @DeleteDateColumn()
  deletedAt: Date;

  // --- RELACIÓN CON PAYMENT (1 a 1) ---
  // Una reserva puede tener un pago asociado (bidireccional con Payment)
  @ApiProperty({ type: () => require('../payments/payment.entity').Payment, description: 'Pago asociado a la reserva', required: false })
  @OneToOne(() => require('../payments/payment.entity').Payment, (payment: any) => payment.appointment)
  payment: any;
}