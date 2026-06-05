import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Business } from '../business/business.entity';

export enum UserRole {
  ADMIN = 'admin', //administrador global, puede hacer de todo
  BUSINESS = 'business', //crea otros usuarios que estan asociados a la empresa
  CUSTOMER = 'customer', //usuario final que utiliza el servicio
}

@Entity('users')
export class User {
  @ApiProperty({ description: 'ID del usuario' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nombre del usuario' })
  @Column()
  nombre: string;

  @ApiProperty({ description: 'Apellido del usuario' })
  @Column()
  apellido: string;

  @ApiProperty({ description: 'Email del usuario' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'Número de teléfono' })
  @Column()
  numero: string;

  @ApiProperty({ description: 'Contraseña encriptada' })
  @Column()
  password?: string;

  @ApiProperty({ enum: UserRole, description: 'Rol del usuario' })
  @Column({
    type: 'varchar',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @ApiProperty({ type: () => Business, description: 'Empresa asociada (si aplica)' })
  @ManyToOne(() => Business, (business) => business.users, { nullable: true })
  business: Business;
}
