/**
 * AppModule es el módulo raíz de la aplicación.
 * Combina todos los demás módulos (como AppointmentsModule) y configura módulos
 * de terceros, incluyendo la configuración de variables de entorno y la base de datos (TypeORM).
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsModule } from './appointments/appointments.module';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_URL || 'data/database.sqlite',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AppointmentsModule,
    CustomersModule,
  ],
})
export class AppModule {}