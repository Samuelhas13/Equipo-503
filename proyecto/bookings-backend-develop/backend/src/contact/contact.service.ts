import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Customer } from '../customers/customer.entity';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UserRole } from '../users/user.entity';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly contactRepository: Repository<ContactMessage>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    createContactDto: CreateContactDto,
    currentUser?: JwtPayload,
  ): Promise<ContactMessage> {
    let customerId: number | undefined;
    let businessId: number | undefined;
    const email = currentUser?.email || createContactDto.email || '';

    if (currentUser) {
      if (currentUser.role === UserRole.BUSINESS) {
        businessId = currentUser.businessId;
      } else if (currentUser.role === UserRole.CUSTOMER) {
        const customer = await this.customerRepository.findOneBy({
          email: currentUser.email,
        });
        if (customer) {
          customerId = customer.id;
        }
      }
    }

    const message = this.contactRepository.create({
      ...createContactDto,
      email,
      customerId,
      businessId,
      isRead: false,
    });
    return this.contactRepository.save(message);
  }

  async findAll(): Promise<ContactMessage[]> {
    return this.contactRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getUnreadCount(): Promise<{ count: number }> {
    const count = await this.contactRepository.count({
      where: {
        isRead: false,
      },
    });
    return { count };
  }

  async updateReadStatus(id: number, isRead: boolean): Promise<ContactMessage> {
    const message = await this.contactRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`No existe mensaje de contacto con id ${id}`);
    }

    message.isRead = isRead;
    return this.contactRepository.save(message);
  }

  async replyToMessage(
    id: number,
    replyMessage: string,
  ): Promise<ContactMessage> {
    const message = await this.contactRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`No existe mensaje de contacto con id ${id}`);
    }

    message.replyMessage = replyMessage;
    message.isRead = true; // Auto-leer al responder
    const saved = await this.contactRepository.save(message);

    try {
      // Crear notificación para el usuario dueño del email si está registrado
      await this.notificationsService.createNotificationByEmail(
        message.email,
        'Respuesta de soporte',
        `El administrador ha respondido a tu consulta sobre "${message.subject.toUpperCase()}":\n\n"${replyMessage}"`,
      );
    } catch (err) {
      console.error('Error enviando notificación de respuesta:', err);
    }

    return saved;
  }

  async remove(id: number): Promise<{ message: string }> {
    const message = await this.contactRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`No existe mensaje de contacto con id ${id}`);
    }

    await this.contactRepository.remove(message);
    return { message: `Mensaje de contacto ${id} eliminado correctamente` };
  }
}
