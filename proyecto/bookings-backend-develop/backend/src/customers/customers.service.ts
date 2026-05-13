import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  findAll() {
    return this.customerRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  create(createCustomerDto: CreateCustomerDto) {
    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }
}
