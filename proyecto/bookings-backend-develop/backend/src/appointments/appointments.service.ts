/**
 * AppointmentsService.
 * Contiene la lógica de negocio central para la gestión de reservas (appointments).
 * Interactúa directamente con la base de datos mediante el repositorio de TypeORM.
 */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    // Inyecta el repositorio de TypeORM para la entidad Appointment, lo que permite interactuar con la tabla
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

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
}
