import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  create(createServiceDto: CreateServiceDto) {
    const { businessId, ...rest } = createServiceDto;
    const service = this.serviceRepository.create({
      ...rest,
      business: { id: businessId }
    });
    return this.serviceRepository.save(service);
  }

  findAll() {
    return this.serviceRepository.find({ relations: ['business'] });
  }

  async findOne(id: number) {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['business']
    });
    if (!service) {
      throw new NotFoundException(`Service #${id} not found`);
    }
    return service;
  }

  async update(id: number, updateServiceDto: UpdateServiceDto) {
    const service = await this.findOne(id);
    const { businessId, ...rest } = updateServiceDto;
    const updated = this.serviceRepository.merge(service, {
      ...rest,
      business: businessId ? { id: businessId } : undefined
    });
    return this.serviceRepository.save(updated);
  }

  async remove(id: number) {
    const service = await this.findOne(id);
    await this.serviceRepository.remove(service);
    return { message: `Service #${id} deleted successfully` };
  }
}
