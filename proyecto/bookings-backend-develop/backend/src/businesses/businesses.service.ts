import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  /**
   * Busca una empresa por su correo electrónico.
   * @param email Correo de la empresa a buscar
   * @returns La entidad Business o null si no se encuentra
   */
  async findByEmail(email: string): Promise<Business | null> {
    return this.businessesRepository.findOneBy({ email });
  }

  /**
   * Obtiene todas las empresas registradas.
   */
  findAll() {
    return this.businessesRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtiene la información detallada de una empresa.
   */
  async findOne(id: number) {
    const business = await this.businessesRepository.findOneBy({ id });
    if (!business) {
      throw new NotFoundException(`Empresa con id ${id} no encontrada`);
    }
    return business;
  }

  /**
   * Crea un nuevo registro de empresa en el sistema.
   * Valida previamente que el email no esté en uso.
   */
  async create(createBusinessDto: CreateBusinessDto) {
    const existing = await this.businessesRepository.findOneBy({ email: createBusinessDto.email });
    if (existing) {
      throw new ConflictException('Ya existe una empresa registrada con este email');
    }
    const business = this.businessesRepository.create(createBusinessDto);
    return this.businessesRepository.save(business);
  }

  /**
   * Modifica los datos de una empresa existente de forma parcial.
   */
  async update(id: number, updateBusinessDto: UpdateBusinessDto) {
    const business = await this.findOne(id);
    const updatedBusiness = this.businessesRepository.merge(business, updateBusinessDto);
    return this.businessesRepository.save(updatedBusiness);
  }

  /**
   * Elimina una empresa permanentemente de la base de datos (Hard Delete).
   */
  async remove(id: number) {
    const business = await this.findOne(id);
    await this.businessesRepository.remove(business);
    return { message: `Empresa ${id} eliminada correctamente` };
  }
}
