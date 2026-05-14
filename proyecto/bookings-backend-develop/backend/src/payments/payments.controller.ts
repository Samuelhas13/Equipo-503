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

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOkResponse({ description: 'Listado de cobros' })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalle de un cobro' })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Cobro creado' })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Cobro actualizado' })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Cobro eliminado' })
  @ApiNotFoundResponse({ description: 'Cobro no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }
}
