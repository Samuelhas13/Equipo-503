import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './customer.entity';
import { UserRole } from '../users/user.entity';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // admin + empresa → listado completo de clientes
  @Get()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOkResponse({
    description: 'Listado completo de clientes',
    type: [Customer],
  })
  findAll(@Request() req: any) {
    return this.customersService.findAll(req.user);
  }

  // todos los roles → un usuario puede consultar su propio perfil
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CUSTOMER)
  @ApiOkResponse({ description: 'Detalle de un cliente', type: Customer })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.customersService.findOne(id, req.user);
  }

  // admin + empresa → pueden dar de alta clientes
  @Post()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiCreatedResponse({
    description: 'Cliente creado exitosamente',
    type: Customer,
  })
  @ApiConflictResponse({ description: 'El email del cliente ya existe' })
  @ApiBadRequestResponse({ description: 'Datos de cliente inválidos' })
  create(@Body() createCustomerDto: CreateCustomerDto, @Request() req: any) {
    return this.customersService.create(createCustomerDto, req.user);
  }

  // admin + empresa → pueden modificar datos de clientes
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOkResponse({
    description: 'Cliente modificado correctamente',
    type: Customer,
  })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  @ApiBadRequestResponse({ description: 'Datos de modificación inválidos' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Request() req: any,
  ) {
    return this.customersService.update(id, updateCustomerDto, req.user);
  }

  // admin + empresa → eliminar cliente
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOkResponse({ description: 'Cliente eliminado correctamente' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.customersService.remove(id, req.user);
  }
}
