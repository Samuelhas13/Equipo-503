/**
 * AppointmentsService.
 * Contiene la lógica de negocio para la gestión de reservas.
 * Interactúa con la base de datos mediante el repositorio de TypeORM.
 */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return this.appointmentsRepository.find({
      order: { date: 'ASC', time: 'ASC' },
      skip,
      take: limit,
    });
  }

  async findOne(id: number) {
    const appointment = await this.appointmentsRepository.findOneBy({ id });
    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }
    return appointment;
  }

  async create(createAppointmentDto: CreateAppointmentDto) {
    const existing = await this.appointmentsRepository.findOneBy({
      date: createAppointmentDto.date,
      time: createAppointmentDto.time,
      businessId: createAppointmentDto.businessId,
    });

    if (existing) {
      throw new BadRequestException('Ya existe una reserva en esa fecha y hora para este negocio');
    }

    const appointment = this.appointmentsRepository.create(createAppointmentDto);
    return this.appointmentsRepository.save(appointment);
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    const appointment = await this.appointmentsRepository.findOneBy({ id });

    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }

    const updatedAppointment = this.appointmentsRepository.merge(
      appointment,
      updateAppointmentDto,
    );

    return this.appointmentsRepository.save(updatedAppointment);
  }

  async remove(id: number) {
    const appointment = await this.appointmentsRepository.findOneBy({ id });

    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }

    await this.appointmentsRepository.softRemove(appointment);

    return { message: `Reserva ${id} eliminada correctamente` };
  }
}