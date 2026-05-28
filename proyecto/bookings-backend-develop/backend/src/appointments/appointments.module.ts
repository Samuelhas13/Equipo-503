/**
 * AppointmentsModule.
 * Define el alcance del dominio de "Reservas".
 * Registra la entidad en TypeORM, el controlador y el servicio,
 * y exporta el servicio por si es requerido en otros módulos.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module'; // ← añadir
import { Appointment } from './appointment.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    AuthModule, // ← añadir
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
