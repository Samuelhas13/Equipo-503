import { Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Appointment } from '../appointments/appointment.entity';
import { Payment } from '../payments/payment.entity';
import { Business } from '../business/business.entity';

@Entity('customers')
export class Customer {
  @ApiProperty({ description: 'ID del cliente' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nombre del cliente' })
  @Column()
  nombre: string;

  @ApiProperty({ description: 'Apellido del cliente' })
  @Column()
  apellido: string;

  @ApiProperty({ description: 'Email del cliente' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'Número del cliente' })
  @Column()
  numero: string;

  @ApiProperty({ type: () => Business, description: 'Empresa asociada' })
  @ManyToOne(() => Business, (business) => business.customers)
  business: Business;

  @ApiProperty({ type: () => [Appointment], description: 'Reservas del cliente' })
  @OneToMany(() => Appointment, (appointment) => appointment.customer)
  appointments: Appointment[];

  @ApiProperty({ type: () => [Payment], description: 'Pagos del cliente' })
  @OneToMany(() => Payment, (payment) => payment.customer)
  payments: Payment[];
}
