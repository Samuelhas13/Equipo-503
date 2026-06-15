import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContactMessage } from './contact.entity';
import { Customer } from '../customers/customer.entity';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactMessage, Customer]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
