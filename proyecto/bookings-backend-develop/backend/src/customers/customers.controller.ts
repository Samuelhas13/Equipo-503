/**
 * CustomersController.
 * Define las rutas (endpoints) REST para manejar clientes (CRUD completo).
 * Se encarga de recibir las peticiones HTTP y delegar la ejecución a CustomersService.
 */
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiConflictResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from '../customers/dto/create-customer.dto';
import { UpdateCustomerDto } from '../customers/dto/update-customer.dto';

@ApiTags('customers') // Agrupa estos endpoints bajo la etiqueta 'customers' en la documentación Swagger
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  // 1. Endpoint POST para crear cliente
  @Post()
  @ApiCreatedResponse({ description: 'Cliente creado exitosamente' })
  @ApiConflictResponse({ description: 'El email del cliente ya existe' })
  @ApiBadRequestResponse({ description: 'Datos de cliente inválidos' })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  // 2. Endpoint GET para obtener todos los clientes
  @Get()
  @ApiOkResponse({ description: 'Listado completo de clientes' })
  findAll() {
    return this.customersService.findAll();
  }

  // 3. Endpoint GET/:id para obtener un solo cliente
  @Get(':id')
  @ApiOkResponse({ description: 'Detalle de un cliente específico' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  // 4. Endpoint PATCH/:id para modificar parcialmente a un cliente
  @Patch(':id')
  @ApiOkResponse({ description: 'Cliente modificado correctamente' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  @ApiBadRequestResponse({ description: 'Datos de modificación inválidos' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  // 5. Endpoint DELETE/:id para borrar un cliente
  @Delete(':id')
  @ApiOkResponse({ description: 'Cliente eliminado correctamente' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(id);
  }
}
