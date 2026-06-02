import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  create(createBusinessDto: CreateBusinessDto) {
    const business = this.businessRepository.create(createBusinessDto);
    return this.businessRepository.save(business);
  }

  findAll() {
    return this.businessRepository.find();
  }

  async findOne(id: number) {
    const business = await this.businessRepository.findOneBy({ id });
    if (!business) {
      throw new NotFoundException(`Business #${id} not found`);
    }
    return business;
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto) {
    const business = await this.findOne(id);
    const updated = this.businessRepository.merge(business, updateBusinessDto);
    return this.businessRepository.save(updated);
  }

  async remove(id: number) {
    const business = await this.findOne(id);
    await this.businessRepository.remove(business);
    return { message: `Business #${id} deleted successfully` };
  }
}
