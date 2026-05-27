/**
 * AppointmentsService.
 * Contiene la lógica de negocio central para la gestión de reservas (appointments).
 * Interactúa directamente con la base de datos mediante el repositorio de TypeORM.
 */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    // Inyecta el repositorio de TypeORM para la entidad Appointment, lo que permite interactuar con la tabla
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) { }

  /**
   * Obtiene una lista paginada de todas las reservas.
   * @param page Número de página actual
   * @param limit Cantidad de reservas por página
   * @returns Un arreglo de reservas ordenadas por fecha y hora ascendente
   */
  findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit; // Calcula cuántos registros omitir (offset)
    return this.appointmentsRepository.find({
      order: { date: 'ASC', time: 'ASC' }, // Orden cronológico
      skip,
      take: limit, // Límite de resultados
    });
  }

  /**
   * Busca una reserva específica por su ID.
   * @param id ID de la reserva
   * @returns La reserva si es encontrada
   * @throws NotFoundException si no existe el ID proporcionado
   */
  async findOne(id: number) {
    const appointment = await this.appointmentsRepository.findOneBy({ id });
    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }
    return appointment;
  }

  /**
   * Crea una nueva reserva asegurando que no haya solapamientos.
   * @param createAppointmentDto Objeto de transferencia de datos con la información de la nueva reserva
   * @returns La reserva recién creada y guardada en base de datos
   * @throws BadRequestException si ya hay una reserva a esa misma hora para el mismo negocio
   */
  async create(createAppointmentDto: CreateAppointmentDto) {
    // Validar solapamiento: busca si existe otra reserva exactamente a esa hora en el mismo local
    const existing = await this.appointmentsRepository.findOneBy({
      date: createAppointmentDto.date,
      time: createAppointmentDto.time,
      businessId: createAppointmentDto.businessId,
    });

    // Si ya existe, se rechaza la solicitud de creación
    if (existing) {
      throw new BadRequestException('Ya existe una reserva en esa fecha y hora para este negocio');
    }

    // Prepara el objeto para guardarse
    const appointment = this.appointmentsRepository.create(createAppointmentDto);
    // Guarda el registro en la base de datos
    return this.appointmentsRepository.save(appointment);
  }

  /**
   * Modifica parcialmente una reserva existente.
   * @param id ID de la reserva a modificar
   * @param updateAppointmentDto Campos a actualizar (ej. cambio de status)
   * @returns La reserva con los datos modificados
   * @throws NotFoundException si el ID no existe
   */
  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    // Verifica si la reserva existe antes de modificar
    const appointment = await this.appointmentsRepository.findOneBy({ id });

    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }

    // Mezcla los datos actuales con los nuevos proporcionados en el DTO
    const updatedAppointment = this.appointmentsRepository.merge(
      appointment,
      updateAppointmentDto,
    );

    // Guarda los cambios en la base de datos
    return this.appointmentsRepository.save(updatedAppointment);
  }

  /**
   * Elimina "suavemente" (Soft Delete) una reserva.
   * En lugar de borrar el registro físico, TypeORM llenará el campo 'deletedAt'.
   * @param id ID de la reserva a eliminar
   * @returns Un mensaje de confirmación
   * @throws NotFoundException si la reserva no existe
   */
  async remove(id: number) {
    // Primero, verifica que la reserva que queremos borrar realmente exista
    const appointment = await this.appointmentsRepository.findOneBy({ id });

    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }

    // softRemove marca el registro como eliminado para mantener histórico sin borrarlo de la BD
    await this.appointmentsRepository.softRemove(appointment);

    return { message: `Reserva ${id} eliminada correctamente` };
  }

  /**
   * Genera un archivo Excel con todas las reservas registradas.
   * @returns Un buffer con el archivo Excel generado.
   */
  async exportToExcel(): Promise<Buffer> {
    const appointments = await this.appointmentsRepository.find({
      relations: { customer: true },
      order: { date: 'ASC', time: 'ASC' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Reservas');

    // Definir columnas con anchos iniciales
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Hora', key: 'time', width: 12 },
      { header: 'Servicio', key: 'serviceName', width: 25 },
      { header: 'ID Cliente', key: 'customerId', width: 12 },
      { header: 'Nombre Cliente', key: 'customerName', width: 25 },
      { header: 'Email Cliente', key: 'customerEmail', width: 25 },
      { header: 'Teléfono Cliente', key: 'customerPhone', width: 20 },
      { header: 'ID Negocio', key: 'businessId', width: 12 },
      { header: 'Negocio Cliente', key: 'customerBusiness', width: 25 },
      { header: 'Estado', key: 'status', width: 15 },
    ];

    // Estilo de la cabecera
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F46E5' }, // Color Indigo/Premium
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Agregar filas
    appointments.forEach((app) => {
      let statusLabel = app.status as string;
      if (app.status === 'pending') statusLabel = 'Pendiente';
      else if (app.status === 'confirmed') statusLabel = 'Confirmada';
      else if (app.status === 'paid') statusLabel = 'Pagada';
      else if (app.status === 'canceled') statusLabel = 'Cancelada';
      else if (app.status === 'completed') statusLabel = 'Completada';

      worksheet.addRow({
        id: app.id,
        date: app.date,
        time: app.time,
        serviceName: app.serviceName,
        customerId: app.customerId,
        customerName: app.customer ? app.customer.name : 'N/A',
        customerEmail: app.customer ? app.customer.email : 'N/A',
        customerPhone: app.customer ? app.customer.phone : 'N/A',
        businessId: app.businessId,
        customerBusiness: app.customer ? app.customer.business || 'N/A' : 'N/A',
        status: statusLabel,
      });
    });

    // Aplicar estilos a las celdas de datos
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Omitir cabecera

      // Estilo de filas alternas para legibilidad (zebrastriping)
      if (rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F9FAFB' }, // Gris muy claro
        };
      }

      row.font = { name: 'Segoe UI', size: 10 };
      row.alignment = { vertical: 'middle' };
      row.height = 20;

      // Centrar columnas de ID, Fecha, Hora y Estado
      row.getCell('id').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('date').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('time').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('customerId').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('businessId').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('status').alignment = { horizontal: 'center', vertical: 'middle' };

      // Dar color al badge de estado
      const statusCell = row.getCell('status');
      const statusVal = statusCell.value;
      if (statusVal === 'Pendiente') {
        statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'D97706' } }; // Naranja
      } else if (statusVal === 'Confirmada') {
        statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '2563EB' } }; // Azul
      } else if (statusVal === 'Pagada' || statusVal === 'Completada') {
        statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '059669' } }; // Verde
      } else if (statusVal === 'Cancelada') {
        statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'DC2626' } }; // Rojo
      }
    });

    // Auto-ajustar el ancho de las columnas dinámicamente según el contenido
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      if (column && column.eachCell) {
        column.eachCell({ includeEmpty: true }, (cell) => {
          const valueStr = cell.value ? cell.value.toString() : '';
          if (valueStr.length > maxLength) {
            maxLength = valueStr.length;
          }
        });
      }
      if (column) {
        column.width = Math.max(maxLength + 4, 10);
      }
    });

    // Generar buffer
    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    return buffer;
  }
}
