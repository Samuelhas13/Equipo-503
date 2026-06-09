import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../customers/customer.entity';
import { Business } from '../business/business.entity';

@Entity('customer_business_points')
@Unique(['customer', 'business'])
export class CustomerBusinessPoints {
  @ApiProperty({ description: 'ID del registro de puntos' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => Customer, description: 'Cliente asociado' })
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  customer: Customer;

  @ApiProperty({ type: () => Business, description: 'Empresa asociada' })
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  business: Business;

  @ApiProperty({ description: 'Puntos acumulados en esta empresa', default: 0 })
  @Column({ default: 0 })
  points: number;
}
