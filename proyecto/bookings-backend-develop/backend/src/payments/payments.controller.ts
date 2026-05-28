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

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // admin + empresa → listado de pagos
  @Get()
  @Roles('admin', 'empresa')
  @ApiOkResponse({ description: 'Listado completo de cobros', type: [Payment] })
  findAll() {
    return this.paymentsService.findAll();
  }

  // admin + empresa → detalle de un pago
  @Get(':id')
  @Roles('admin', 'empresa')
  @ApiOkResponse({ description: 'Detalle de un cobro', type: Payment })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  // admin + empresa → registrar un pago
  @Post()
  @Roles('admin', 'empresa')
  @ApiCreatedResponse({
    description: 'Cobro creado correctamente',
    type: Payment,
  })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  // admin + empresa → modificar un pago
  @Patch(':id')
  @Roles('admin', 'empresa')
  @ApiOkResponse({
    description: 'Cobro actualizado correctamente',
    type: Payment,
  })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  // solo admin → eliminar un pago
  @Delete(':id')
  @Roles('admin')
  @ApiOkResponse({ description: 'Cobro eliminado correctamente' })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }
}
