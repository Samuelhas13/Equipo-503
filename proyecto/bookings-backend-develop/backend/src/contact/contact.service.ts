import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly contactRepository: Repository<ContactMessage>,
  ) {}

  async create(createContactDto: CreateContactDto): Promise<ContactMessage> {
    const message = this.contactRepository.create({
      ...createContactDto,
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
