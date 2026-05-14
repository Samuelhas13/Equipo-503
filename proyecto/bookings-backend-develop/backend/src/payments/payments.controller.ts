/**
 * PaymentsController.
 * Expone los endpoints de la API REST para la gestión de cobros y pagos.
 * Toda petición entrante es procesada aquí y delegada al PaymentsService.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './payment.entity';

@ApiTags('payments') // Agrupa los endpoints bajo 'payments' en Swagger UI
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // 1. Endpoint GET: Obtiene la lista completa de pagos
  @Get()
  @ApiOkResponse({ description: 'Listado completo de cobros', type: [Payment] })
  findAll() {
    return this.paymentsService.findAll();
  }

  // 2. Endpoint GET/:id: Busca un pago específico por ID
  @Get(':id')
  @ApiOkResponse({ description: 'Detalle de un cobro específico', type: Payment })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  // 3. Endpoint POST: Crea un nuevo pago
  @Post()
  @ApiCreatedResponse({ description: 'Cobro creado correctamente', type: Payment })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  // 4. Endpoint PATCH/:id: Modifica el estado o detalles de un pago existente
  @Patch(':id')
  @ApiOkResponse({ description: 'Cobro actualizado correctamente', type: Payment })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  // 5. Endpoint DELETE/:id: Elimina un pago del sistema
  @Delete(':id')
  @ApiOkResponse({ description: 'Cobro eliminado correctamente' })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }
}
