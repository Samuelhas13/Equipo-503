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
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalle de una reserva' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Reserva creada' })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Reserva actualizada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Reserva eliminada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.remove(id);
  }
}