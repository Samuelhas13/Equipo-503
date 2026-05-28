/**
 * CustomersModule.
 * Empaqueta la entidad, el servicio y el controlador de la gestión de Clientes.
 * Al importar TypeOrmModule.forFeature([Customer]), hace que el repositorio de Customer
 * esté disponible para inyectarlo en el CustomersService.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module'; // ← añadir
import { Customer } from './customer.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Payment } from 'src/payments/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Payment]),
    AuthModule, // ← añadir
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
