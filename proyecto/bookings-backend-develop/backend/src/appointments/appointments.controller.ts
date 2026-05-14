/**
 * AppointmentsController.
 * Expone los endpoints de la API REST para gestionar reservas.
 * Delega la lógica de negocio al servicio AppointmentsService.
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
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOkResponse({ description: 'Listado de reservas' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.appointmentsService.findAll(pageNum, limitNum);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalle de una reserva' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Reserva creada' })
  @ApiBadRequestResponse({ description: 'Datos de reserva inválidos' })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Reserva actualizada' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  @ApiBadRequestResponse({ description: 'Datos de reserva inválidos' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Reserva eliminada' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.remove(id);
  }
}