/**
 * CustomersModule.
 * Empaqueta la entidad, el servicio y el controlador de la gestión de Clientes.
 * Al importar TypeOrmModule.forFeature([Customer]), hace que el repositorio de Customer
 * esté disponible para inyectarlo en el CustomersService.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])], // Registra la entidad de base de datos
  controllers: [CustomersController], // Registra las rutas
  providers: [CustomersService], // Registra la lógica de negocio
  exports: [CustomersService], // Lo exportamos por si en un futuro AppointmentsService requiere buscar información de clientes
})
export class CustomersModule {}
