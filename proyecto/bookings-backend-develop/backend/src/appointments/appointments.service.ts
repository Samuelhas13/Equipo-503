import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
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
      order: { hora_reserva: 'ASC' },
      skip,
      take: limit,
      relations: ['customer', 'business', 'service', 'user'],
    });
  }

  async findOne(id: number) {
    const appointment = await this.appointmentsRepository.findOne({ 
      where: { id },
      relations: ['customer', 'business', 'service', 'user'],
    });
    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }
    return appointment;
  }

  async create(createAppointmentDto: CreateAppointmentDto) {
    const { businessId, serviceId, customerId, userId, ...rest } = createAppointmentDto;

    const existing = await this.appointmentsRepository.findOne({
      where: {
        hora_reserva: rest.hora_reserva,
        business: { id: businessId },
      }
    });

    if (existing) {
      throw new BadRequestException('Ya existe una reserva en esa fecha y hora para este negocio');
    }

    const appointment = this.appointmentsRepository.create({
      ...rest,
      business: { id: businessId },
      service: { id: serviceId },
      customer: customerId ? { id: customerId } : undefined,
      user: userId ? { id: userId } : undefined,
    });

    return this.appointmentsRepository.save(appointment);
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    const appointment = await this.findOne(id);
    const { businessId, serviceId, customerId, userId, ...rest } = updateAppointmentDto;

    const updatedAppointment = this.appointmentsRepository.merge(appointment, {
      ...rest,
      business: businessId ? { id: businessId } : undefined,
      service: serviceId ? { id: serviceId } : undefined,
      customer: customerId ? { id: customerId } : undefined,
      user: userId ? { id: userId } : undefined,
    });

    return this.appointmentsRepository.save(updatedAppointment);
  }

  async remove(id: number) {
    const appointment = await this.findOne(id);
    await this.appointmentsRepository.remove(appointment);
    return { message: `Reserva ${id} eliminada correctamente` };
  }

  async exportToExcel(): Promise<Buffer> {
    const appointments = await this.appointmentsRepository.find({
      relations: ['customer', 'business', 'service', 'user'],
      order: { hora_reserva: 'ASC' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Reservas');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Hora Reserva', key: 'hora_reserva', width: 20 },
      { header: 'Servicio', key: 'serviceName', width: 25 },
      { header: 'Cliente', key: 'customerName', width: 25 },
      { header: 'Email Cliente', key: 'customerEmail', width: 25 },
      { header: 'Negocio', key: 'businessName', width: 25 },
    ];

    appointments.forEach((app) => {
      worksheet.addRow({
        id: app.id,
        hora_reserva: app.hora_reserva,
        serviceName: app.service ? app.service.nombre : 'N/A',
        customerName: app.customer ? app.customer.nombre + ' ' + app.customer.apellido : 'N/A',
        customerEmail: app.customer ? app.customer.email : 'N/A',
        businessName: app.business ? app.business.nombre : 'N/A',
      });
    });

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }
}
