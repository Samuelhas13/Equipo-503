/**
 * PaymentsService.
 * Contiene la lógica de negocio para la gestión de cobros/pagos.
 * Interactúa con la base de datos a través del repositorio TypeORM de Payment.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    // Inyecta el repositorio para interactuar con la tabla de 'payment'
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
  ) {}

  /**
   * Obtiene todos los pagos registrados.
   * @returns Lista de pagos ordenados por fecha ascendente, incluyendo la reserva asociada.
   */
  findAll() {
    return this.paymentsRepository.find({
      order: { date: 'ASC' },
      relations: ['appointment', 'customer'], // Incluye las relaciones en la respuesta
    });
  }

  /**
   * Obtiene la información detallada de un pago específico.
   * @param id ID único del pago
   * @returns El pago y su reserva/cliente asociados
   * @throws NotFoundException si no existe el ID
   */
  async findOne(id: number) {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['appointment', 'customer'],
    });

    if (!payment) {
      throw new NotFoundException(`No existe el pago con id ${id}`);
    }

    return payment;
  }

  /**
   * Registra un nuevo pago en el sistema.
   * @param createPaymentDto Objeto con los datos del pago
   * @returns El pago guardado en base de datos
   */
  create(createPaymentDto: CreatePaymentDto) {
    // Aquí se podría añadir validación para ver si el appointmentId existe
    const payment = this.paymentsRepository.create(createPaymentDto);
    return this.paymentsRepository.save(payment);
  }

  /**
   * Actualiza parcialmente la información de un pago (por ejemplo, cambiar status a PAID).
   * @param id ID del pago a modificar
   * @param updatePaymentDto Datos parciales a modificar
   * @returns El pago actualizado
   */
  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.paymentsRepository.findOneBy({ id });

    if (!payment) {
      throw new NotFoundException(`No existe el pago con id ${id}`);
    }

    const updatedPayment = this.paymentsRepository.merge(
      payment,
      updatePaymentDto,
    );

    return this.paymentsRepository.save(updatedPayment);
  }

  /**
   * Elimina un registro de pago de la base de datos de manera permanente.
   * @param id ID del pago a borrar
   * @returns Mensaje de confirmación
   */
  async remove(id: number) {
    const payment = await this.paymentsRepository.findOneBy({ id });

    if (!payment) {
      throw new NotFoundException(`No existe el pago con id ${id}`);
    }

    await this.paymentsRepository.remove(payment);

    return { message: `Pago ${id} eliminado correctamente` };
  }
}
