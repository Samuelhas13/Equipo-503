import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Business {
  @ApiProperty({ example: 1, description: 'Identificador único de la empresa' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'Peluquería Nova',
    description: 'Nombre de la empresa',
  })
  @Column()
  name: string;

  @ApiProperty({
    example: 'Belleza & Estética',
    description: 'Categoría o actividad comercial',
  })
  @Column()
  category: string;

  @ApiProperty({
    example: 'contacto@peluquerianova.com',
    description: 'Correo electrónico de contacto',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    example: '+34 600 123 456',
    description: 'Teléfono de contacto',
  })
  @Column()
  phone: string;

  @ApiProperty({
    example: 'Cortes, peinados y tratamientos capilares de vanguardia.',
    description: 'Descripción de la empresa',
    nullable: true,
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    example: '2026-05-14T08:00:00Z',
    description: 'Fecha de creación',
  })
  @CreateDateColumn()
  createdAt: Date;
}
