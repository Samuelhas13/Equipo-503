/**
 * CustomersService.
 * Contiene toda la lógica de negocio y base de datos relacionada con clientes.
 * Interactúa con la base de datos a través del repositorio TypeORM de Customer.
 */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    // Inyectamos el repositorio que actúa como ORM directo para la entidad Customer
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
  ) { }

  /**
   * Obtiene todos los clientes registrados.
   * @returns Lista de clientes ordenados del más reciente al más antiguo
   */
  findAll() {
    return this.customersRepository.find({
      order: { createdAt: 'DESC' }, // Ordenar por creación más reciente por defecto
    });
  }

  /**
   * Obtiene la información detallada de un cliente.
   * @param id ID único del cliente
   * @returns La entidad Customer encontrada
   * @throws NotFoundException si no existe el ID proporcionado
   */
  async findOne(id: number) {
    const customer = await this.customersRepository.findOneBy({ id });
    if (!customer) {
      throw new NotFoundException(`Cliente con id ${id} no encontrado`);
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
  async create(createCustomerDto: CreateCustomerDto) {
    // Comprobamos si el email ya existe para evitar errores en base de datos (por el unique: true)
    const existing = await this.customersRepository.findOneBy({ email: createCustomerDto.email });
    if (existing) {
      throw new ConflictException('Ya existe un cliente registrado con este email');
    }
    // Instancia el cliente y lo graba en base de datos
    const customer = this.customersRepository.create(createCustomerDto);
    return this.customersRepository.save(customer);
  }

  /**
   * Modifica los datos de un cliente existente de forma parcial.
   * @param id ID del cliente a editar
   * @param updateCustomerDto Objeto con los nuevos datos (parcial)
   * @returns El objeto del cliente tras la modificación
   */
  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.findOne(id); // Aprovechamos findOne que ya lanza error si no existe
    // Mezcla el registro actual de BD con los campos modificados
    const updatedCustomer = this.customersRepository.merge(customer, updateCustomerDto);
    return this.customersRepository.save(updatedCustomer);
  }

  /**
   * Elimina un cliente permanentemente de la base de datos (Hard Delete).
   * @param id ID del cliente a borrar
   * @returns Objeto con un mensaje de éxito
   */
  async remove(id: number) {
    const customer = await this.findOne(id); // Validamos primero que exista
    await this.customersRepository.remove(customer);
    return { message: `Cliente ${id} eliminado correctamente` };
  }
}
