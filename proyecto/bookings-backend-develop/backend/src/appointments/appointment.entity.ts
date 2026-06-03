import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { Business } from '../business/business.entity';
import { Service } from '../services/service.entity';
import { Payment } from '../payments/payment.entity';
import { Customer } from '../customers/customer.entity';

@Entity('appointments')
export class Appointment {
  @ApiProperty({ description: 'ID de la reserva' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => User, description: 'Usuario que realiza la reserva', required: false })
  @ManyToOne(() => User, { nullable: true })
  user: User;

  @ApiProperty({ type: () => Customer, description: 'Cliente asociado a la reserva', required: false })
  @ManyToOne(() => Customer, (customer) => customer.appointments, { nullable: true })
  customer: Customer;

  @ApiProperty({ type: () => Business, description: 'Empresa asociada' })
  @ManyToOne(() => Business, (business) => business.appointments)
  business: Business;

  @ApiProperty({ type: () => Service, description: 'Servicio reservado' })
  @ManyToOne(() => Service)
  service: Service;

  @ApiProperty({ description: 'Hora de la reserva' })
  @Column()
  hora_reserva: string;

  @ApiProperty({ description: 'Estado de la reserva', default: 'pending' })
  @Column({ default: 'pending' })
  status: string;

  @ApiProperty({ description: 'Nombre del servicio', required: false })
  @Column({ nullable: true })
  serviceName: string;

  @ApiProperty({ type: () => Payment, description: 'Pago asociado', required: false })
  @OneToOne(() => Payment, (payment) => payment.appointment)
  payment: Payment;
}