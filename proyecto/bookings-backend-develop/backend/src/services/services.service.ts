import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UserRole } from '../users/user.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  create(createServiceDto: CreateServiceDto, currentUser: JwtPayload) {
    if (currentUser.role === UserRole.BUSINESS) {
      createServiceDto.businessId = currentUser.businessId!;
    }
    const { businessId, ...rest } = createServiceDto;
    const service = this.serviceRepository.create({
      ...rest,
      business: businessId ? { id: businessId } : undefined,
    });
    return this.serviceRepository.save(service);
  }

  findAll(currentUser: JwtPayload) {
    if (currentUser.role === UserRole.BUSINESS) {
      return this.serviceRepository.find({
        where: { business: { id: currentUser.businessId } },
        relations: ['business'],
      });
    }
    return this.serviceRepository.find({ relations: ['business'] });
  }

  async findOne(id: number, currentUser: JwtPayload) {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['business'],
    });
    if (!service) {
      throw new NotFoundException(`Service #${id} not found`);
    }
    if (
      currentUser.role === UserRole.BUSINESS &&
      service.business?.id !== currentUser.businessId
    ) {
      throw new ForbiddenException(
        'You can only access services from your business',
      );
    }
    return service;
  }

  async update(
    id: number,
    updateServiceDto: UpdateServiceDto,
    currentUser: JwtPayload,
  ) {
    const service = await this.findOne(id, currentUser);
    if (currentUser.role === UserRole.BUSINESS) {
      updateServiceDto.businessId = currentUser.businessId!;
    }
    const { businessId, ...rest } = updateServiceDto;
    const updated = this.serviceRepository.merge(service, {
      ...rest,
      business: businessId ? { id: businessId } : undefined,
    });
    return this.serviceRepository.save(updated);
  }

  async remove(id: number, currentUser: JwtPayload) {
    const service = await this.findOne(id, currentUser);
    await this.serviceRepository.remove(service);
    return { message: `Service #${id} deleted successfully` };
  }
}
