/**
 * Entidad Customer.
 * Define la tabla 'customer' en la base de datos usando TypeORM.
 * Representa a un cliente que realiza reservas en el sistema.
 */
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Customer {
  // Identificador único autoincremental
  @PrimaryGeneratedColumn()
  id: number;

  // Nombre completo del cliente
  @Column()
  name: string;

  // Correo electrónico del cliente (único para evitar duplicados)
  @Column({ unique: true })
  email: string;

  // Número de teléfono de contacto
  @Column()
  phone: string;

  // Fecha de registro creada automáticamente al insertar el registro
  @CreateDateColumn()
  createdAt: Date;
}
