import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private readonly businessesRepository: Repository<Business>,
  ) {}

  findAll() {
    return this.businessesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const business = await this.businessesRepository.findOneBy({ id });
    if (!business) {
      throw new NotFoundException(`No existe la empresa con id ${id}`);
    }
    return business;
  }

  async create(createBusinessDto: CreateBusinessDto) {
    const existing = await this.businessesRepository.findOneBy({
      email: createBusinessDto.email,
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe una empresa con el email ${createBusinessDto.email}`,
      );
    }
    const business = this.businessesRepository.create(createBusinessDto);
    return this.businessesRepository.save(business);
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto) {
    const business = await this.businessesRepository.findOneBy({ id });
    if (!business) {
      throw new NotFoundException(`No existe la empresa con id ${id}`);
    }

    // Verificar email duplicado solo si se está cambiando
    if (updateBusinessDto.email && updateBusinessDto.email !== business.email) {
      const existing = await this.businessesRepository.findOneBy({
        email: updateBusinessDto.email,
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe una empresa con el email ${updateBusinessDto.email}`,
        );
      }
    }

    const updated = this.businessesRepository.merge(
      business,
      updateBusinessDto,
    );
    return this.businessesRepository.save(updated);
  }

  async remove(id: number) {
    const business = await this.businessesRepository.findOneBy({ id });
    if (!business) {
      throw new NotFoundException(`No existe la empresa con id ${id}`);
    }
    await this.businessesRepository.remove(business);
    return { message: `Empresa ${id} eliminada correctamente` };
  }
}
