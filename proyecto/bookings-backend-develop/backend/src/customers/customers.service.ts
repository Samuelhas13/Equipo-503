/**
 * CustomersService.
 * Contiene toda la lógica de negocio y base de datos relacionada con clientes.
 * Interactúa con la base de datos a través del repositorio TypeORM de Customer.
 */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from '../customers/dto/create-customer.dto';
import { UpdateCustomerDto } from '../customers/dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
  ) { }

  // 1. Obtener todos los clientes (Endpoint GET)
  findAll() {
    return this.customersRepository.find({
      order: { createdAt: 'DESC' }, // Ordenar por creación más reciente por defecto
    });
  }

  // 2. Obtener un cliente específico (Endpoint GET/:id)
  async findOne(id: number) {
    const customer = await this.customersRepository.findOneBy({ id });
    if (!customer) {
      throw new NotFoundException(`Cliente con id ${id} no encontrado`);
    }
    return customer;
  }

  // 3. Crear un nuevo cliente (Endpoint POST)
  async create(createCustomerDto: CreateCustomerDto) {
    // Comprobamos si el email ya existe para evitar errores en base de datos (por el unique: true)
    const existing = await this.customersRepository.findOneBy({ email: createCustomerDto.email });
    if (existing) {
      throw new ConflictException('Ya existe un cliente registrado con este email');
    }
    const customer = this.customersRepository.create(createCustomerDto);
    return this.customersRepository.save(customer);
  }

  // 4. Actualizar un cliente existente (Endpoint PATCH/:id)
  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.findOne(id); // Aprovechamos findOne que ya comprueba si existe
    const updatedCustomer = this.customersRepository.merge(customer, updateCustomerDto);
    return this.customersRepository.save(updatedCustomer);
  }

  // 5. Eliminar un cliente permanentemente (Endpoint DELETE/:id)
  async remove(id: number) {
    const customer = await this.findOne(id); // Validamos primero que exista
    await this.customersRepository.remove(customer);
    return { message: `Cliente ${id} eliminado correctamente` };
  }
}
