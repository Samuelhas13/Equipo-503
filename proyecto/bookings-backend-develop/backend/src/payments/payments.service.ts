import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Payment } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UserRole } from '../users/user.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  findAll(currentUser?: JwtPayload) {
    if (currentUser?.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('No tienes permiso para acceder a los pagos');
    }

    const where: any = {};
    if (currentUser?.role === UserRole.BUSINESS) {
      where.appointment = { business: { id: currentUser.businessId } };
    }

    return this.paymentsRepository.find({
      where,
      order: { hora_pago: 'ASC' },
      relations: ['appointment', 'customer', 'servicio', 'appointment.business'],
    });
  }

  async findOne(id: number, currentUser?: JwtPayload) {
    if (currentUser?.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('No tienes permiso para acceder a los pagos');
    }

    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['appointment', 'customer', 'servicio', 'appointment.business'],
    });

    if (!payment) {
      throw new NotFoundException(`No existe el pago con id ${id}`);
    }

    if (currentUser?.role === UserRole.BUSINESS && payment.appointment?.business?.id !== currentUser.businessId) {
      throw new ForbiddenException('Solo puedes acceder a los pagos de tu empresa');
    }

    return payment;
  }

  async create(createPaymentDto: CreatePaymentDto, currentUser?: JwtPayload) {
    if (currentUser?.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('No tienes permiso para registrar pagos');
    }

    const appointment = await this.appointmentsRepository.findOne({
      where: { id: createPaymentDto.appointmentId },
      relations: ['customer', 'business', 'user'],
    });

    if (!appointment) {
      throw new BadRequestException(
        `No existe la reserva con id ${createPaymentDto.appointmentId}`,
      );
    }

    if (currentUser?.role === UserRole.BUSINESS && appointment.business?.id !== currentUser.businessId) {
      throw new ForbiddenException('No puedes registrar pagos para reservas de otras empresas');
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

  async update(id: number, updatePaymentDto: UpdatePaymentDto, currentUser?: JwtPayload) {
    if (currentUser?.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('No tienes permiso para modificar pagos');
    }

    const payment = await this.findOne(id, currentUser);

    if (updatePaymentDto.appointmentId && updatePaymentDto.appointmentId !== payment.appointment?.id) {
      const newAppointment = await this.appointmentsRepository.findOne({
        where: { id: updatePaymentDto.appointmentId },
        relations: ['business']
      });
      if (currentUser?.role === UserRole.BUSINESS && newAppointment?.business?.id !== currentUser.businessId) {
        throw new ForbiddenException('No puedes asociar un pago a la reserva de otra empresa');
      }
    }

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

  async remove(id: number, currentUser?: JwtPayload) {
    if (currentUser?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar pagos');
    }

    const payment = await this.findOne(id, currentUser);
    await this.paymentsRepository.remove(payment);
    return { message: `Pago ${id} eliminado correctamente` };
  }
}
