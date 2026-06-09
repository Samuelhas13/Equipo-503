import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../customers/customer.entity';
import { Reward } from './reward.entity';

@Entity('reward_redemptions')
export class RewardRedemption {
  @ApiProperty({ description: 'ID del canje' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => Customer, description: 'Cliente que canjea' })
  @ManyToOne(() => Customer, (customer) => customer.redemptions)
  customer: Customer;

  @ApiProperty({ type: () => Reward, description: 'Premio canjeado' })
  @ManyToOne(() => Reward, (reward) => reward.redemptions)
  reward: Reward;

  @ApiProperty({ description: 'Fecha del canje' })
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  redeemedAt: Date;

  @ApiProperty({ description: 'Estado del canje', default: 'pending' })
  @Column({ default: 'pending' })
  status: string; // 'pending' | 'used'

  @ApiProperty({ description: 'Código único de validación' })
  @Column({ unique: true })
  code: string;
}
