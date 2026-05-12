import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/database.sqlite',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AppointmentsModule,
  ],
})
export class AppModule {}