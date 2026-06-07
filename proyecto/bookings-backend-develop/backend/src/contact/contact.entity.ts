import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum ContactSubject {
  SUPPORT = 'support',
  BILLING = 'billing',
  SALES = 'sales',
  OTHER = 'other',
}

@Entity('contacts')
export class ContactMessage {
  @ApiProperty({ description: 'ID del mensaje de contacto' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nombre completo del remitente' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Correo electrónico del remitente' })
  @Column()
  email: string;

  @ApiProperty({ enum: ContactSubject, description: 'Asunto de la consulta' })
  @Column({
    type: 'varchar',
    enum: ContactSubject,
    default: ContactSubject.SUPPORT,
  })
  subject: ContactSubject;

  @ApiProperty({ description: 'Mensaje o consulta detallada' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({
    description: 'Indica si el mensaje ha sido leído por el administrador',
  })
  @Column({ default: false })
  isRead: boolean;

  @ApiProperty({ description: 'Fecha de creación del registro' })
  @CreateDateColumn()
  createdAt: Date;
}
