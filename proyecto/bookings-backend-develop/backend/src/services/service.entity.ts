import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Business } from '../business/business.entity';

@Entity('services')
export class Service {
  @ApiProperty({ description: 'ID del servicio' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nombre del servicio' })
  @Column()
  nombre: string;

  @ApiProperty({ description: 'Precio del servicio' })
  @Column('decimal')
  precio: number;

  @ApiProperty({ type: () => Business, description: 'Empresa asociada' })
  @ManyToOne(() => Business, (business) => business.services)
  business: Business;
}
