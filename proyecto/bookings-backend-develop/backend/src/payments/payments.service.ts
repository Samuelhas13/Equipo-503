import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Payment } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  findAll() {
    return this.paymentsRepository.find({
      order: { hora_pago: 'ASC' },
      relations: ['appointment', 'customer', 'servicio'],
    });
  }

  async findOne(id: number) {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['appointment', 'customer', 'servicio'],
    });

    if (!payment) {
      throw new NotFoundException(`No existe el pago con id ${id}`);
    }

    return payment;
  }

  async create(createPaymentDto: CreatePaymentDto) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: createPaymentDto.appointmentId },
      relations: ['customer'],
    });

    if (!appointment) {
      throw new BadRequestException(
        `No existe la reserva con id ${createPaymentDto.appointmentId}`,
      );
    }

    if (appointment.customer && createPaymentDto.customerId !== appointment.customer.id) {
      throw new BadRequestException(
        'El cliente del pago debe coincidir con el cliente de la reserva asociada.',
      );
    }

    const existingPayment = await this.paymentsRepository.findOne({
      where: { appointment: { id: createPaymentDto.appointmentId } },
    });

    if (existingPayment) {
      throw new BadRequestException(
        `Ya existe un cobro registrado para la reserva ${createPaymentDto.appointmentId}`,
      );
    }

    const { customerId, appointmentId, servicioId, ...rest } = createPaymentDto;

    const payment = this.paymentsRepository.create({
      ...rest,
      customer: { id: customerId },
      appointment: { id: appointmentId },
      servicio: { id: servicioId },
    });
    
    return this.paymentsRepository.save(payment);
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.findOne(id);
    const { customerId, appointmentId, servicioId, ...rest } = updatePaymentDto;

    const updatedPayment = this.paymentsRepository.merge(
      payment,
      {
        ...rest,
        customer: customerId ? { id: customerId } : undefined,
        appointment: appointmentId ? { id: appointmentId } : undefined,
        servicio: servicioId ? { id: servicioId } : undefined,
      }
    );

    return this.paymentsRepository.save(updatedPayment);
  }

  async remove(id: number) {
    const payment = await this.findOne(id);
    await this.paymentsRepository.remove(payment);
    return { message: `Pago ${id} eliminado correctamente` };
  }
}
