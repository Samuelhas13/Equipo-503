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
    // ConfigModule: Carga variables de entorno (ej. del archivo .env) y las hace globales
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // TypeOrmModule.forRoot: Conecta la aplicación con la base de datos (SQLite en este caso)
    TypeOrmModule.forRoot({
      type: 'sqlite', // Motor de BD
      database: process.env.DATABASE_URL || 'data/database.sqlite', // Ruta al archivo de la base de datos
      autoLoadEntities: true, // Carga automáticamente todas las entidades decoradas con @Entity()
      // synchronize: true crea o altera las tablas automáticamente en base a las entidades (Peligroso en producción real)
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AppointmentsModule,
    CustomersModule,
  ],
})
export class AppModule {}