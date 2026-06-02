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
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './payment.entity';
import { UserRole } from '../users/user.entity';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // admin + empresa → listado de pagos
  @Get()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOkResponse({ description: 'Listado completo de cobros', type: [Payment] })
  findAll(@Request() req: any) {
    return this.paymentsService.findAll(req.user);
  }

  // admin + empresa → detalle de un pago
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOkResponse({ description: 'Detalle de un cobro', type: Payment })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.paymentsService.findOne(id, req.user);
  }

  // admin + empresa → registrar un pago
  @Post()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CUSTOMER)
  @ApiCreatedResponse({
    description: 'Cobro creado correctamente',
    type: Payment,
  })
  create(@Body() createPaymentDto: CreatePaymentDto, @Request() req: any) {
    return this.paymentsService.create(createPaymentDto, req.user);
  }

  // admin + empresa → modificar un pago
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOkResponse({
    description: 'Cobro actualizado correctamente',
    type: Payment,
  })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @Request() req: any,
  ) {
    return this.paymentsService.update(id, updatePaymentDto, req.user);
  }

  // solo admin → eliminar un pago
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Cobro eliminado correctamente' })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.paymentsService.remove(id, req.user);
  }
}
