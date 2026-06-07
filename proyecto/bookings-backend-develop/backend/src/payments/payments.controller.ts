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
import { JwtPayload } from '../auth/jwt-payload.interface';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // admin + empresa + cliente → listado de pagos
  @Get()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CUSTOMER)
  @ApiOkResponse({ description: 'Listado completo de cobros', type: [Payment] })
  findAll(@Request() req: { user: JwtPayload }) {
    return this.paymentsService.findAll(req.user);
  }

  // admin + empresa + cliente → detalle de un pago
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CUSTOMER)
  @ApiOkResponse({ description: 'Detalle de un cobro', type: Payment })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: JwtPayload },
  ) {
    return this.paymentsService.findOne(id, req.user);
  }

  // admin + empresa → registrar un pago (el cliente no puede crear cobros directos)
  @Post()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiCreatedResponse({
    description: 'Cobro creado correctamente',
    type: Payment,
  })
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.paymentsService.create(createPaymentDto, req.user);
  }

  // admin + empresa + cliente → modificar un pago
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CUSTOMER)
  @ApiOkResponse({
    description: 'Cobro actualizado correctamente',
    type: Payment,
  })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.paymentsService.update(id, updatePaymentDto, req.user);
  }

  // admin + empresa → eliminar un pago (autorizado según pertenencia en el service)
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOkResponse({ description: 'Cobro eliminado correctamente' })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: JwtPayload },
  ) {
    return this.paymentsService.remove(id, req.user);
  }
}
