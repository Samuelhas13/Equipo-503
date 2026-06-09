import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Business } from '../business/business.entity';
import { RewardRedemption } from './reward-redemption.entity';

@Entity('rewards')
export class Reward {
  @ApiProperty({ description: 'ID del premio' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => Business, description: 'Empresa asociada' })
  @ManyToOne(() => Business, (business) => business.rewards)
  business: Business;

  @ApiProperty({ description: 'Título del premio' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Descripción del premio', required: false })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ description: 'Tipo de premio (descuento o regalo)' })
  @Column()
  type: string; // 'discount' | 'gift'

  @ApiProperty({ description: 'Porcentaje de descuento si aplica', required: false })
  @Column('decimal', { nullable: true })
  discountValue: number;

  @ApiProperty({ description: 'Puntos necesarios para canjearlo' })
  @Column({ default: 0 })
  requiredPoints: number;

  @ApiProperty({ description: 'Si el premio está activo' })
  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => RewardRedemption, (redemption) => redemption.reward)
  redemptions: RewardRedemption[];
}
