import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOkResponse({ description: 'Listado de clientes' })
  findAll() {
    return this.customersService.findAll();
  }

  @Post()
  @ApiCreatedResponse({ description: 'Cliente creado' })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }
}
