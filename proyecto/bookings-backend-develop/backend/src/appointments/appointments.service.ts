import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOptionsWhere } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Appointment } from './appointment.entity';
import { Customer } from '../customers/customer.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UserRole } from '../users/user.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  findAll(page?: number, limit?: number, currentUser?: JwtPayload) {
    let where: FindOptionsWhere<Appointment> | FindOptionsWhere<Appointment>[] =
      {};

    if (currentUser?.role === UserRole.BUSINESS) {
      where = { business: { id: currentUser.businessId } };
    } else if (currentUser?.role === UserRole.CUSTOMER) {
      where = [
        { user: { id: currentUser.sub } },
        { customer: { email: currentUser.email } },
      ];
    }

    const options: FindManyOptions<Appointment> = {
      where,
      order: { hora_reserva: 'ASC' },
      relations: ['customer', 'business', 'service', 'user'],
    };

    if (page !== undefined && limit !== undefined) {
      options.skip = (page - 1) * limit;
      options.take = limit;
    }

    return this.appointmentsRepository.find(options);
  }

  async findOne(id: number, currentUser?: JwtPayload) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['customer', 'business', 'service', 'user'],
    });

    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }

    if (
      currentUser?.role === UserRole.BUSINESS &&
      appointment.business?.id !== currentUser.businessId
    ) {
      throw new ForbiddenException(
        'Solo puedes acceder a las reservas de tu empresa',
      );
    }

    if (
      currentUser?.role === UserRole.CUSTOMER &&
      appointment.user?.id !== currentUser.sub &&
      appointment.customer?.email !== currentUser.email
    ) {
      throw new ForbiddenException(
        'Solo puedes acceder a tus propias reservas',
      );
    }

    return appointment;
  }

  async create(
    createAppointmentDto: CreateAppointmentDto,
    currentUser?: JwtPayload,
  ) {
    if (currentUser?.role === UserRole.BUSINESS) {
      createAppointmentDto.businessId = currentUser.businessId!;
    } else if (currentUser?.role === UserRole.CUSTOMER) {
      createAppointmentDto.userId = currentUser.sub;
      const customer = await this.customerRepository.findOneBy({
        email: currentUser.email,
      });

      if (customer) {
        createAppointmentDto.customerId = customer.id;
      }
    }

    const { businessId, serviceId, customerId, userId, ...rest } =
      createAppointmentDto;

    const existing = await this.appointmentsRepository.findOne({
      where: {
        hora_reserva: rest.hora_reserva,
        business: { id: businessId },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Ya existe una reserva en esa fecha y hora para este negocio',
      );
    }

    const appointment = this.appointmentsRepository.create({
      ...rest,
      business: { id: businessId },
      service: serviceId ? { id: serviceId } : undefined,
      customer: customerId ? { id: customerId } : undefined,
      user: userId ? { id: userId } : undefined,
    });

    return this.appointmentsRepository.save(appointment);
  }

  async update(
    id: number,
    updateAppointmentDto: UpdateAppointmentDto,
    currentUser?: JwtPayload,
  ) {
    const appointment = await this.findOne(id, currentUser);

    if (currentUser?.role === UserRole.BUSINESS) {
      updateAppointmentDto.businessId = currentUser.businessId!;
    } else if (currentUser?.role === UserRole.CUSTOMER) {
      updateAppointmentDto.userId = currentUser.sub;
    }

    const { businessId, serviceId, customerId, userId, ...rest } =
      updateAppointmentDto;

    const updatedAppointment = this.appointmentsRepository.merge(appointment, {
      ...rest,
      business: businessId ? { id: businessId } : undefined,
      service: serviceId ? { id: serviceId } : undefined,
      customer: customerId ? { id: customerId } : undefined,
      user: userId ? { id: userId } : undefined,
    });

    return this.appointmentsRepository.save(updatedAppointment);
  }

  async remove(id: number, currentUser?: JwtPayload) {
    const appointment = await this.findOne(id, currentUser);
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
        serviceName:
          app.serviceName || (app.service ? app.service.nombre : 'N/A'),
        customerName: app.customer
          ? `${app.customer.nombre} ${app.customer.apellido}`
          : app.user
            ? `${app.user.nombre} ${app.user.apellido}`
            : 'N/A',
        customerEmail: app.customer
          ? app.customer.email
          : app.user
            ? app.user.email
            : 'N/A',
        businessName: app.business ? app.business.nombre : 'N/A',
      });
    });

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }
}
