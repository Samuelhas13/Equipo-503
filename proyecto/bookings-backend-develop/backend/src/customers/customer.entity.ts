/**
 * Entidad Customer.
 * Define la tabla 'customer' en la base de datos usando TypeORM.
 * Representa a un cliente que realiza reservas en el sistema.
 */
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Appointment } from '../appointments/appointment.entity';

@Entity()
export class Customer {
  @ApiProperty({ example: 1, description: 'Identificador único del cliente' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo' })
  @Column()
  name: string;

  @ApiProperty({ example: 'juan@example.com', description: 'Correo electrónico' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: '+34 600 123 456', description: 'Teléfono de contacto' })
  @Column()
  phone: string;

  @ApiProperty({ example: '2026-05-14T08:00:00Z', description: 'Fecha de creación' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ type: () => [Appointment], description: 'Reservas del cliente' })
  @OneToMany(() => Appointment, (appointment) => appointment.customer)
  appointments: Appointment[];
}
