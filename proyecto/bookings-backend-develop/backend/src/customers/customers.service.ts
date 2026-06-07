/**
 * CustomersService.
 * Contiene toda la lógica de negocio y base de datos relacionada con clientes.
 * Interactúa con la base de datos a través del repositorio TypeORM de Customer.
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UserRole } from '../users/user.entity';

@Injectable()
export class CustomersService {
  constructor(
    // Inyectamos el repositorio que actúa como ORM directo para la entidad Customer
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
  ) {}

  /**
   * Obtiene todos los clientes registrados.
   * @returns Lista de clientes ordenados del más reciente al más antiguo
   */
  findAll(currentUser: JwtPayload) {
    if (currentUser.role === UserRole.BUSINESS) {
      return this.customersRepository.find({
        where: { business: { id: currentUser.businessId } },
        order: { id: 'DESC' },
      });
    }
    return this.customersRepository.find({
      order: { id: 'DESC' }, // Ordenar por creación más reciente por defecto
    });
  }

  /**
   * Obtiene la información detallada de un cliente.
   * @param id ID único del cliente
   * @returns La entidad Customer encontrada
   * @throws NotFoundException si no existe el ID proporcionado
   */
  async findOne(id: number, currentUser: JwtPayload) {
    const customer = await this.customersRepository.findOne({
      where: { id },
      relations: ['business'],
    });
    if (!customer) {
      throw new NotFoundException(`Cliente con id ${id} no encontrado`);
    }

    if (
      currentUser.role === UserRole.BUSINESS &&
      customer.business?.id !== currentUser.businessId
    ) {
      throw new ForbiddenException(
        'Solo puedes acceder a los clientes de tu empresa',
      );
    }
    if (
      currentUser.role === UserRole.CUSTOMER &&
      customer.email !== currentUser.email
    ) {
      throw new ForbiddenException(
        'Solo puedes acceder a tus propios datos de cliente',
      );
    }

    return customer;
  }

  /**
   * Crea un nuevo registro de cliente en el sistema.
   * Valida previamente que el email no esté en uso.
   * @param createCustomerDto Información enviada para crear el cliente
   * @returns El objeto del cliente recién guardado
   * @throws ConflictException si el email ya existe en BD
   */
  async create(createCustomerDto: CreateCustomerDto, currentUser: JwtPayload) {
    if (currentUser.role === UserRole.BUSINESS) {
      createCustomerDto.businessId = currentUser.businessId;
    }

    // Comprobamos si el email ya existe para evitar errores en base de datos (por el unique: true)
    const existing = await this.customersRepository.findOneBy({
      email: createCustomerDto.email,
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe un cliente registrado con este email',
      );
    }
    // Instancia el cliente y lo graba en base de datos
    const { businessId, ...rest } = createCustomerDto;
    const customer = this.customersRepository.create({
      ...rest,
      business: businessId ? { id: businessId } : undefined,
    });
    return this.customersRepository.save(customer);
  }

  /**
   * Modifica los datos de un cliente existente de forma parcial.
   * @param id ID del cliente a editar
   * @param updateCustomerDto Objeto con los nuevos datos (parcial)
   * @returns El objeto del cliente tras la modificación
   */
  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
    currentUser: JwtPayload,
  ) {
    const customer = await this.findOne(id, currentUser);

    if (currentUser.role === UserRole.BUSINESS) {
      updateCustomerDto.businessId = currentUser.businessId;
    }

    const { businessId, ...rest } = updateCustomerDto;
    const updatedCustomer = this.customersRepository.merge(customer, {
      ...rest,
      business: businessId ? { id: businessId } : undefined,
    });
    return this.customersRepository.save(updatedCustomer);
  }

  /**
   * Elimina un cliente permanentemente de la base de datos (Hard Delete).
   * @param id ID del cliente a borrar
   * @returns Objeto con un mensaje de éxito
   */
  async remove(id: number, currentUser: JwtPayload) {
    const customer = await this.findOne(id, currentUser); // Validamos primero que exista
    await this.customersRepository.remove(customer);
    return { message: `Cliente ${id} eliminado correctamente` };
  }
}
