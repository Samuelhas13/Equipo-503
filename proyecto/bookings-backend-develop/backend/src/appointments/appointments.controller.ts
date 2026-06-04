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
  Request,
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
import { UserRole } from '../users/user.entity';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CUSTOMER)
  @ApiOkResponse({ description: 'Listado de reservas', type: [Appointment] })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Request() req?: any) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.appointmentsService.findAll(pageNum, limitNum, req.user);
  }

  @Get('export')
  @Roles(UserRole.ADMIN)
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

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CUSTOMER)
  @ApiOkResponse({ description: 'Detalle de una reserva', type: Appointment })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req?: any) {
    return this.appointmentsService.findOne(id, req.user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CUSTOMER)
  @ApiCreatedResponse({ description: 'Reserva creada', type: Appointment })
  @ApiBadRequestResponse({ description: 'Datos de reserva invalidos' })
  create(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req?: any) {
    return this.appointmentsService.create(createAppointmentDto, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOkResponse({ description: 'Reserva actualizada', type: Appointment })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  @ApiBadRequestResponse({ description: 'Datos de reserva invalidos' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Request() req?: any,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOkResponse({ description: 'Reserva eliminada' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req?: any) {
    return this.appointmentsService.remove(id, req.user);
  }
}
