import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CustomersModule } from '../customers/customers.module';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [CustomersModule, BusinessesModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
