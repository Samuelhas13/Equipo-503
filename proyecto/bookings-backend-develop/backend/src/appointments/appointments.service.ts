import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOptionsWhere, DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Appointment } from './appointment.entity';
import { Customer } from '../customers/customer.entity';
import { Service } from '../services/service.entity';
import { RewardRedemption } from '../rewards/reward-redemption.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UserRole } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
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

    const saved = await this.appointmentsRepository.save(appointment);

    if (saved.status === 'paid' && customerId && serviceId) {
      if (!saved.couponCode) {
        await this.adjustCustomerPoints(customerId, serviceId, 'add');
      } else {
        await this.markCouponAsUsed(saved.couponCode);
      }
    }

    try {
      const fullApp = await this.appointmentsRepository.findOne({
        where: { id: saved.id },
        relations: ['service', 'business', 'customer', 'user'],
      });

      if (fullApp) {
        const serviceName = fullApp.serviceName || (fullApp.service ? fullApp.service.nombre : 'Servicio');
        const businessName = fullApp.business ? fullApp.business.nombre : 'Negocio';

        if (fullApp.user?.id) {
          await this.notificationsService.createNotification(
            fullApp.user.id,
            'Reserva Confirmada',
            `Tu reserva para el servicio "${serviceName}" en "${businessName}" ha sido programada con éxito para el ${fullApp.hora_reserva}.`,
          );
        }

        if (fullApp.business?.id) {
          const clientName = fullApp.customer
            ? `${fullApp.customer.nombre} ${fullApp.customer.apellido}`
            : fullApp.user
            ? `${fullApp.user.nombre} ${fullApp.user.apellido}`
            : 'Cliente';

          await this.notificationsService.notifyBusiness(
            fullApp.business.id,
            'Nueva Reserva Recibida',
            `El cliente ${clientName} ha reservado el servicio "${serviceName}" para el ${fullApp.hora_reserva}.`,
          );
        }
      }
    } catch (err) {
      console.error('Error enviando notificaciones de creación de reserva:', err);
    }

    return saved;
  }

  async update(
    id: number,
    updateAppointmentDto: UpdateAppointmentDto,
    currentUser?: JwtPayload,
  ) {
    const appointment = await this.findOne(id, currentUser);
    const oldHora = appointment.hora_reserva;
    const oldStatus = appointment.status;
    const oldCustomerId = appointment.customer?.id;
    const oldServiceId = appointment.service?.id;

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

    const saved = await this.appointmentsRepository.save(updatedAppointment);

    // Adjust points based on status transition
    const newStatus = saved.status;
    const newCustomerId = customerId || oldCustomerId;
    const newServiceId = serviceId || oldServiceId;

    if (oldStatus === 'paid' && newStatus !== 'paid') {
      if (oldCustomerId && oldServiceId && !saved.couponCode) {
        await this.adjustCustomerPoints(oldCustomerId, oldServiceId, 'subtract');
      }
    } else if (oldStatus !== 'paid' && newStatus === 'paid') {
      if (newCustomerId && newServiceId) {
        if (!saved.couponCode) {
          await this.adjustCustomerPoints(newCustomerId, newServiceId, 'add');
        } else {
          await this.markCouponAsUsed(saved.couponCode);
        }
      }
    } else if (oldStatus === 'paid' && newStatus === 'paid') {
      if (oldCustomerId !== newCustomerId || oldServiceId !== newServiceId) {
        if (oldCustomerId && oldServiceId && !saved.couponCode) {
          await this.adjustCustomerPoints(oldCustomerId, oldServiceId, 'subtract');
        }
        if (newCustomerId && newServiceId && !saved.couponCode) {
          await this.adjustCustomerPoints(newCustomerId, newServiceId, 'add');
        }
      }
    }

    try {
      const fullApp = await this.appointmentsRepository.findOne({
        where: { id: saved.id },
        relations: ['service', 'business', 'customer', 'user'],
      });

      if (fullApp) {
        const serviceName = fullApp.serviceName || (fullApp.service ? fullApp.service.nombre : 'Servicio');
        const businessName = fullApp.business ? fullApp.business.nombre : 'Negocio';
        const newHora = fullApp.hora_reserva;

        if (fullApp.user?.id) {
          await this.notificationsService.createNotification(
            fullApp.user.id,
            'Reserva Modificada',
            `Tu reserva para "${serviceName}" en "${businessName}" ha sido modificada. Nuevo horario: ${newHora} (Antes: ${oldHora}).`,
          );
        }

        if (fullApp.business?.id) {
          const clientName = fullApp.customer
            ? `${fullApp.customer.nombre} ${fullApp.customer.apellido}`
            : fullApp.user
            ? `${fullApp.user.nombre} ${fullApp.user.apellido}`
            : 'Cliente';

          await this.notificationsService.notifyBusiness(
            fullApp.business.id,
            'Reserva Modificada',
            `La reserva del cliente ${clientName} para "${serviceName}" ha sido modificada. Nuevo horario: ${newHora} (Antes: ${oldHora}).`,
          );
        }
      }
    } catch (err) {
      console.error('Error enviando notificaciones de modificación de reserva:', err);
    }

    return saved;
  }

  async remove(id: number, currentUser?: JwtPayload) {
    const appointment = await this.findOne(id, currentUser);
    
    const serviceName = appointment.serviceName || (appointment.service ? appointment.service.nombre : 'Servicio');
    const businessName = appointment.business ? appointment.business.nombre : 'Negocio';
    const businessId = appointment.business?.id;
    const customerUserId = appointment.user?.id;
    const customerName = appointment.customer 
      ? `${appointment.customer.nombre} ${appointment.customer.apellido}` 
      : appointment.user 
      ? `${appointment.user.nombre} ${appointment.user.apellido}` 
      : 'Cliente';
    const hora = appointment.hora_reserva;

    if (appointment.status === 'paid' && appointment.customer?.id && appointment.service?.id) {
      await this.adjustCustomerPoints(appointment.customer.id, appointment.service.id, 'subtract');
    }

    await this.appointmentsRepository.remove(appointment);

    try {
      if (customerUserId) {
        await this.notificationsService.createNotification(
          customerUserId,
          'Reserva Cancelada',
          `Tu reserva para el servicio "${serviceName}" en "${businessName}" programada para el ${hora} ha sido cancelada.`,
        );
      }

      if (businessId) {
        await this.notificationsService.notifyBusiness(
          businessId,
          'Reserva Cancelada',
          `La reserva del cliente ${customerName} para el servicio "${serviceName}" programada para el ${hora} ha sido cancelada.`,
        );
      }
    } catch (err) {
      console.error('Error enviando notificaciones de cancelación de reserva:', err);
    }

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

  private async adjustCustomerPoints(
    customerId: number,
    serviceId: number,
    action: 'add' | 'subtract',
  ) {
    try {
      const customer = await this.customerRepository.findOneBy({ id: customerId });
      const service = await this.serviceRepository.findOne({
        where: { id: serviceId },
        relations: ['business'],
      });

      if (customer && service) {
        const points = Math.floor(Number(service.precio) * 10);

        if (action === 'add') {
          customer.puntos += points;
        } else {
          customer.puntos = Math.max(0, customer.puntos - points);
        }

        await this.customerRepository.save(customer);
      }
    } catch (err) {
      console.error('Error al ajustar puntos del cliente desde reserva:', err);
    }
  }

  private async markCouponAsUsed(code: string) {
    try {
      const redemptionRepo = this.dataSource.getRepository(RewardRedemption);
      const redemption = await redemptionRepo.findOneBy({ code });
      if (redemption && redemption.status !== 'used') {
        redemption.status = 'used';
        await redemptionRepo.save(redemption);
      }
    } catch (err) {
      console.error('Error al marcar cupón como usado:', err);
    }
  }

  async getDashboardStats(currentUser?: JwtPayload) {
    const isBusiness = currentUser?.role === UserRole.BUSINESS;
    const bizId = currentUser?.businessId;

    const totalCountQuery = this.appointmentsRepository.createQueryBuilder('a')
      .leftJoin('a.business', 'b');
    if (isBusiness) {
      totalCountQuery.where('b.id = :bizId', { bizId });
    }
    const totalBookings = await totalCountQuery.getCount();

    const historicRevenueQuery = this.appointmentsRepository.createQueryBuilder('a')
      .leftJoin('a.service', 's')
      .leftJoin('a.business', 'b')
      .select('SUM(CASE WHEN a.couponCode IS NULL THEN s.precio ELSE 0 END)', 'total');
    if (isBusiness) {
      historicRevenueQuery.where('b.id = :bizId', { bizId });
    }
    const rawHistoric = await historicRevenueQuery.getRawOne();
    const historicRevenue = Number(rawHistoric?.total) || 0;

    const statusQuery = this.appointmentsRepository.createQueryBuilder('a')
      .leftJoin('a.business', 'b')
      .select('a.status', 'status')
      .addSelect('COUNT(a.id)', 'count');
    if (isBusiness) {
      statusQuery.where('b.id = :bizId', { bizId });
    }
    const rawStatus = await statusQuery.groupBy('a.status').getRawMany();
    
    const statusMap = { pending: 0, confirmed: 0, completed: 0, paid: 0, canceled: 0 };
    rawStatus.forEach((row) => {
      if (row.status in statusMap) {
        statusMap[row.status as keyof typeof statusMap] = Number(row.count) || 0;
      }
    });

    const total = totalBookings || 1;
    const pending = statusMap.pending;
    const confirmed = statusMap.confirmed + statusMap.completed;
    const paid = statusMap.paid;
    const completed = statusMap.completed;

    const stats = {
      completedPct: Math.round((completed / total) * 100) || 0,
      paidPct: Math.round((paid / total) * 100) || 0,
      confirmedPct: Math.round((confirmed / total) * 100) || 0,
      pendingPct: Math.round((pending / total) * 100) || 0,
    };

    const dailyQuery = this.appointmentsRepository.createQueryBuilder('a')
      .leftJoin('a.service', 's')
      .leftJoin('a.business', 'b')
      .select('a.id % 7', 'dayIndex')
      .addSelect('SUM(CASE WHEN a.couponCode IS NULL THEN s.precio ELSE 0 END)', 'revenue')
      .addSelect('COUNT(a.id)', 'count');
    if (isBusiness) {
      dailyQuery.where('b.id = :bizId', { bizId });
    }
    const rawDaily = await dailyQuery.groupBy('dayIndex').getRawMany();

    const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const dailyMap = new Array(7).fill(null).map((_, i) => ({
      day: daysOfWeek[i],
      revenue: 0,
      count: 0
    }));

    rawDaily.forEach((row) => {
      const idx = Number(row.dayIndex);
      if (idx >= 0 && idx < 7) {
        dailyMap[idx].revenue = Number(row.revenue) || 0;
        dailyMap[idx].count = Number(row.count) || 0;
      }
    });

    const weeklyRevenue = dailyMap.reduce((sum, d) => sum + d.revenue, 0);

    const servicesQuery = this.appointmentsRepository.createQueryBuilder('a')
      .leftJoin('a.service', 's')
      .leftJoin('a.business', 'b')
      .select('COALESCE(a.serviceName, s.nombre)', 'name')
      .addSelect('COUNT(a.id)', 'count');
    if (isBusiness) {
      servicesQuery.where('b.id = :bizId', { bizId });
    }
    const rawPopular = await servicesQuery
      .groupBy('name')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    const popularServices = rawPopular.map((row) => ({
      name: row.name || "Servicio General",
      count: Number(row.count) || 0,
    }));

    let activeBusinesses = 0;
    if (!isBusiness) {
      const activeBizRes = await this.appointmentsRepository.createQueryBuilder('a')
        .select('COUNT(DISTINCT a.businessId)', 'count')
        .getRawOne();
      activeBusinesses = Number(activeBizRes?.count) || 0;
    }

    let paidRevenue = 0;
    let pendingRevenue = 0;
    if (isBusiness) {
      const paidQuery = this.appointmentsRepository.createQueryBuilder('a')
        .leftJoin('a.service', 's')
        .leftJoin('a.business', 'b')
        .select('SUM(CASE WHEN a.couponCode IS NULL THEN s.precio ELSE 0 END)', 'total')
        .where('b.id = :bizId AND a.status = :status', { bizId, status: 'paid' });
      const rawPaid = await paidQuery.getRawOne();
      paidRevenue = Number(rawPaid?.total) || 0;

      const pendingQuery = this.appointmentsRepository.createQueryBuilder('a')
        .leftJoin('a.service', 's')
        .leftJoin('a.business', 'b')
        .select('SUM(CASE WHEN a.couponCode IS NULL THEN s.precio ELSE 0 END)', 'total')
        .where('b.id = :bizId AND a.status = :status', { bizId, status: 'pending' });
      const rawPending = await pendingQuery.getRawOne();
      pendingRevenue = Number(rawPending?.total) || 0;
    }

    return {
      historicRevenue,
      weeklyRevenue,
      totalBookings,
      activeBusinesses,
      paidRevenue,
      pendingRevenue,
      stats,
      revenueData: dailyMap,
      popularServices,
    };
  }
}
