import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
  ) {}

  findAll() {
    return this.paymentsRepository.find({
      order: { date: 'ASC' },
      relations: ['appointment'],
    });
  }

  async findOne(id: number) {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['appointment'],
    });

    if (!payment) {
      throw new NotFoundException(`No existe el pago con id ${id}`);
    }

    return payment;
  }

  create(createPaymentDto: CreatePaymentDto) {
    const payment = this.paymentsRepository.create(createPaymentDto);
    return this.paymentsRepository.save(payment);
  }

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

  async remove(id: number) {
    const payment = await this.paymentsRepository.findOneBy({ id });

    if (!payment) {
      throw new NotFoundException(`No existe el pago con id ${id}`);
    }

    await this.paymentsRepository.remove(payment);

    return { message: `Pago ${id} eliminado correctamente` };
  }
}
