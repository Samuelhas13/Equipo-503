import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Service } from 'src/services/service.entity'; 
import { Customer } from '../customers/customer.entity';
import { Appointment } from '../appointments/appointment.entity';
import { User } from 'src/users/user.entity';

@Entity('business')
export class Business {
  @ApiProperty({ description: 'ID de la empresa' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nombre de la empresa' })
  @Column()
  nombre: string;

  @ApiProperty({ description: 'Dirección de la empresa' })
  @Column()
  direccion: string;

  @ApiProperty({ type: () => [Service] })
  @OneToMany(() => Service, (service) => service.business)
  services: Service[];

  @ApiProperty({ type: () => [Customer] })
  @OneToMany(() => Customer, (customer) => customer.business)
  customers: Customer[];

  @ApiProperty({ type: () => [Appointment] })
  @OneToMany(() => Appointment, (appointment) => appointment.business)
  appointments: Appointment[];

  @ApiProperty({ type: () => [User] })
  @OneToMany(() => User, (user) => user.business)
  users: User[];
}
