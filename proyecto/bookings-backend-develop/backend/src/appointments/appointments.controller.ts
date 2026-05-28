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
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './appointment.entity';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // admin + empresa → ven el listado completo
  @Get()
  @Roles('admin', 'empresa', 'usuario')
  @ApiOkResponse({ description: 'Listado de reservas', type: [Appointment] })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.appointmentsService.findAll(pageNum, limitNum);
  }

  // solo admin → exportar Excel
  @Get('export')
  @Roles('admin')
  @ApiOkResponse({ description: 'Reporte exportado a Excel (.xlsx)' })
  async exportExcel(@Res() res: Response) {
    const buffer = await this.appointmentsService.exportToExcel();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="reporte_reservas.xlsx"',
    );
    res.send(buffer);
  }

  // todos los roles → pueden ver el detalle de una reserva concreta
  @Get(':id')
  @Roles('admin', 'empresa', 'usuario')
  @ApiOkResponse({ description: 'Detalle de una reserva', type: Appointment })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  // todos los roles → el usuario puede crear su propia reserva
  @Post()
  @Roles('admin', 'empresa', 'usuario')
  @ApiCreatedResponse({ description: 'Reserva creada', type: Appointment })
  @ApiBadRequestResponse({ description: 'Datos de reserva inválidos' })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  // admin + empresa → pueden modificar reservas
  @Patch(':id')
  @Roles('admin', 'empresa')
  @ApiOkResponse({ description: 'Reserva actualizada', type: Appointment })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  @ApiBadRequestResponse({ description: 'Datos de reserva inválidos' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  // solo admin → puede eliminar reservas
  @Delete(':id')
  @Roles('admin')
  @ApiOkResponse({ description: 'Reserva eliminada' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.remove(id);
  }
}
