import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module'; // ← añadir
import { Appointment } from '../appointments/appointment.entity';
import { Payment } from './payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Customer } from '../customers/customer.entity';
import { Service } from '../services/service.entity';
import { CustomerBusinessPoints } from '../rewards/customer-business-points.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Appointment, Customer, Service, CustomerBusinessPoints]),
    AuthModule, // ← añadir
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
