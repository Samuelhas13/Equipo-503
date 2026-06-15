import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  DataSource,
  FindManyOptions,
} from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Payment, PaymentStatus } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UserRole } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';
import { Service } from '../services/service.entity';
import { RewardRedemption } from '../rewards/reward-redemption.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(page?: number, limit?: number, currentUser?: JwtPayload) {
    const where: FindOptionsWhere<Payment> = {};
    if (currentUser?.role === UserRole.BUSINESS) {
      where.appointment = { business: { id: currentUser.businessId } };
    } else if (currentUser?.role === UserRole.CUSTOMER) {
      where.customer = { email: currentUser.email };
    }

    const options: FindManyOptions<Payment> = {
      where,
      order: { hora_pago: 'ASC' },
      relations: [
        'appointment',
        'customer',
        'servicio',
        'appointment.business',
      ],
    };

    if (page !== undefined && limit !== undefined) {
      options.skip = (page - 1) * limit;
      options.take = limit;
    }

    return this.paymentsRepository.find(options);
  }

  async findOne(id: number, currentUser?: JwtPayload) {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: [
        'appointment',
        'customer',
        'servicio',
        'appointment.business',
      ],
    });

    if (!payment) {
      throw new NotFoundException(`No existe el pago con id ${id}`);
    }

    if (
      currentUser?.role === UserRole.BUSINESS &&
      payment.appointment?.business?.id !== currentUser.businessId
    ) {
      throw new ForbiddenException(
        'Solo puedes acceder a los pagos de tu empresa',
      );
    }

    if (
      currentUser?.role === UserRole.CUSTOMER &&
      payment.customer?.email !== currentUser.email
    ) {
      throw new ForbiddenException('Solo puedes acceder a tus propios pagos');
    }

    return payment;
  }

  async create(createPaymentDto: CreatePaymentDto, currentUser?: JwtPayload) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: createPaymentDto.appointmentId },
      relations: ['customer', 'business', 'user'],
    });

    if (!appointment) {
      throw new BadRequestException(
        `No existe la reserva con id ${createPaymentDto.appointmentId}`,
      );
    }

    if (
      currentUser?.role === UserRole.BUSINESS &&
      appointment.business?.id !== currentUser.businessId
    ) {
      throw new ForbiddenException(
        'No puedes registrar pagos para reservas de otras empresas',
      );
    }

    if (
      currentUser?.role === UserRole.CUSTOMER &&
      appointment.user?.id !== currentUser.sub
    ) {
      throw new ForbiddenException('Solo puedes pagar tus propias reservas');
    }

    if (
      appointment.customer &&
      createPaymentDto.customerId !== appointment.customer.id
    ) {
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

    const savedPayment = await this.paymentsRepository.save(payment);

    if (savedPayment.estado === PaymentStatus.PAGADO) {
      const app = await this.appointmentsRepository.findOne({
        where: { id: appointmentId },
      });
      if (app && app.couponCode) {
        await this.markCouponAsUsed(app.couponCode);
      } else {
        await this.adjustCustomerPoints(customerId, servicioId, 'add');
      }
    }

    return savedPayment;
  }

  async update(
    id: number,
    updatePaymentDto: UpdatePaymentDto,
    currentUser?: JwtPayload,
  ) {
    const payment = await this.findOne(id, currentUser);

    const oldEstado = payment.estado;
    const oldCustomerId = payment.customer?.id;
    const oldServiceId = payment.servicio?.id;

    if (currentUser?.role === UserRole.CUSTOMER) {
      // El cliente no puede cambiar asociaciones clave
      delete updatePaymentDto.customerId;
      delete updatePaymentDto.appointmentId;
    }

    if (
      updatePaymentDto.appointmentId &&
      updatePaymentDto.appointmentId !== payment.appointment?.id
    ) {
      const newAppointment = await this.appointmentsRepository.findOne({
        where: { id: updatePaymentDto.appointmentId },
        relations: ['business'],
      });
      if (
        currentUser?.role === UserRole.BUSINESS &&
        newAppointment?.business?.id !== currentUser.businessId
      ) {
        throw new ForbiddenException(
          'No puedes asociar un pago a la reserva de otra empresa',
        );
      }
    }

    const { customerId, appointmentId, servicioId, ...rest } = updatePaymentDto;

    const updatedPayment = this.paymentsRepository.merge(payment, {
      ...rest,
      customer: customerId ? { id: customerId } : undefined,
      appointment: appointmentId ? { id: appointmentId } : undefined,
      servicio: servicioId ? { id: servicioId } : undefined,
    });

    const savedPayment = await this.paymentsRepository.save(updatedPayment);

    const newEstado = savedPayment.estado;
    const newCustomerId = customerId || oldCustomerId;
    const newServiceId = servicioId || oldServiceId;

    const app = await this.appointmentsRepository.findOne({
      where: { id: savedPayment.appointment?.id },
    });
    const hasCoupon = app && app.couponCode;

    if (
      oldEstado === PaymentStatus.PAGADO &&
      newEstado !== PaymentStatus.PAGADO
    ) {
      if (oldCustomerId && oldServiceId && !hasCoupon) {
        await this.adjustCustomerPoints(
          oldCustomerId,
          oldServiceId,
          'subtract',
        );
      }
    } else if (
      oldEstado !== PaymentStatus.PAGADO &&
      newEstado === PaymentStatus.PAGADO
    ) {
      if (newCustomerId && newServiceId) {
        if (hasCoupon) {
          await this.markCouponAsUsed(app.couponCode);
        } else {
          await this.adjustCustomerPoints(newCustomerId, newServiceId, 'add');
        }
      }
    } else if (
      oldEstado === PaymentStatus.PAGADO &&
      newEstado === PaymentStatus.PAGADO
    ) {
      if (oldCustomerId !== newCustomerId || oldServiceId !== newServiceId) {
        if (oldCustomerId && oldServiceId && !hasCoupon) {
          await this.adjustCustomerPoints(
            oldCustomerId,
            oldServiceId,
            'subtract',
          );
        }
        if (newCustomerId && newServiceId && !hasCoupon) {
          await this.adjustCustomerPoints(newCustomerId, newServiceId, 'add');
        }
      }
    }

    return savedPayment;
  }

  async remove(id: number, currentUser?: JwtPayload) {
    const payment = await this.findOne(id, currentUser);

    if (
      payment.estado === PaymentStatus.PAGADO &&
      payment.customer?.id &&
      payment.servicio?.id
    ) {
      await this.adjustCustomerPoints(
        payment.customer.id,
        payment.servicio.id,
        'subtract',
      );
    }

    await this.paymentsRepository.remove(payment);
    return { message: `Pago ${id} eliminado correctamente` };
  }

  private async adjustCustomerPoints(
    customerId: number,
    serviceId: number,
    action: 'add' | 'subtract',
  ) {
    try {
      const customer = await this.customerRepository.findOneBy({
        id: customerId,
      });
      const service = await this.serviceRepository.findOne({
        where: { id: serviceId },
        relations: ['business'],
      });

      if (customer && service) {
        const points = Math.floor(Number(service.precio) * 10);

        if (action === 'add') {
          customer.puntos += points;
        } else {
          customer.puntos = Math.max(0, customer.puntos - points);
        }

        await this.customerRepository.save(customer);
      }
    } catch (err) {
      console.error('Error al ajustar puntos del cliente:', err);
    }
  }

  private async markCouponAsUsed(code: string) {
    try {
      const redemptionRepo = this.dataSource.getRepository(RewardRedemption);
      const redemption = await redemptionRepo.findOneBy({ code });
      if (redemption && redemption.status !== 'used') {
        redemption.status = 'used';
        await redemptionRepo.save(redemption);
      }
    } catch (err) {
      console.error('Error al marcar cupón como usado:', err);
    }
  }
}
