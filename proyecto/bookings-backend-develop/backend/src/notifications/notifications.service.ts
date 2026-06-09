import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { User, UserRole } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  async createNotification(
    userId: number,
    title: string,
    message: string,
  ): Promise<Notification> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const notification = this.notificationRepository.create({
      title,
      message,
      user,
      isRead: false,
    });
    return this.notificationRepository.save(notification);
  }

  async createNotificationByEmail(
    email: string,
    title: string,
    message: string,
  ): Promise<Notification | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return null;
    }
    return this.createNotification(user.id, title, message);
  }

  async notifyBusiness(
    businessId: number,
    title: string,
    message: string,
  ): Promise<void> {
    const users = await this.userRepository.find({
      where: { business: { id: businessId } },
    });
    for (const user of users) {
      await this.createNotification(user.id, title, message);
    }
  }

  async generateBookingReminders(userId: number): Promise<void> {
    const now = new Date();
    // 24 horas a partir de ahora
    const targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['business'],
    });
    if (!user) return;

    if (user.role === UserRole.CUSTOMER) {
      // Recordatorios para clientes
      const appointments = await this.appointmentsRepository.find({
        where: [
          { user: { id: userId } },
          { customer: { email: user.email } },
        ],
        relations: ['service', 'business'],
      });

      for (const app of appointments) {
        // SQLite almacena fechas como 'YYYY-MM-DD HH:MM'. Reemplazamos espacio con T para compatibilidad de parsing.
        const appDate = new Date(app.hora_reserva.replace(' ', 'T'));
        if (isNaN(appDate.getTime())) continue;

        if (appDate > now && appDate <= targetTime) {
          const message = `Recordatorio: Tienes una reserva para el servicio "${
            app.serviceName || (app.service ? app.service.nombre : 'Servicio')
          }" en "${
            app.business ? app.business.nombre : 'Negocio'
          }" mañana a las ${app.hora_reserva.split(' ')[1] || app.hora_reserva}.`;

          const alreadyExists = await this.notificationRepository.findOne({
            where: {
              user: { id: userId },
              message: message,
            },
          });

          if (!alreadyExists) {
            await this.createNotification(userId, 'Recordatorio de Reserva', message);
          }
        }
      }
    } else if (user.role === UserRole.BUSINESS && user.business) {
      // Recordatorios para comercios
      const appointments = await this.appointmentsRepository.find({
        where: { business: { id: user.business.id } },
        relations: ['service', 'customer', 'user'],
      });

      for (const app of appointments) {
        const appDate = new Date(app.hora_reserva.replace(' ', 'T'));
        if (isNaN(appDate.getTime())) continue;

        if (appDate > now && appDate <= targetTime) {
          const clientName = app.customer
            ? `${app.customer.nombre} ${app.customer.apellido}`
            : app.user
            ? `${app.user.nombre} ${app.user.apellido}`
            : 'Cliente';

          const message = `Recordatorio de Negocio: Tienes una reserva programada con el cliente ${clientName} para el servicio "${
            app.serviceName || (app.service ? app.service.nombre : 'Servicio')
          }" mañana a las ${app.hora_reserva.split(' ')[1] || app.hora_reserva}.`;

          const alreadyExists = await this.notificationRepository.findOne({
            where: {
              user: { id: userId },
              message: message,
            },
          });

          if (!alreadyExists) {
            await this.createNotification(
              userId,
              'Recordatorio de Reserva (Negocio)',
              message,
            );
          }
        }
      }
    }
  }

  async findAllForUser(userId: number): Promise<Notification[]> {
    // Generar los recordatorios dinámicamente antes de retornar la lista
    try {
      await this.generateBookingReminders(userId);
    } catch (err) {
      console.error('Error generating booking reminders:', err);
    }

    return this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!notification) {
      throw new NotFoundException(
        `Notificación con ID ${id} no encontrada para este usuario`,
      );
    }
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    const notification = await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!notification) {
      throw new NotFoundException(
        `Notificación con ID ${id} no encontrada para este usuario`,
      );
    }
    await this.notificationRepository.remove(notification);
    return { message: 'Notificación eliminada correctamente' };
  }
}
