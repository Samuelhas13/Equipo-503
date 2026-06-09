import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';

@Entity('notifications')
export class Notification {
  @ApiProperty({ description: 'ID de la notificación' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Título de la notificación' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Mensaje de la notificación' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ description: 'Indica si la notificación fue leída', default: false })
  @Column({ default: false })
  isRead: boolean;

  @ApiProperty({ description: 'Fecha de creación de la notificación' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ type: () => User, description: 'Usuario que recibe la notificación' })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
