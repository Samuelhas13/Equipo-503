import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reward } from './reward.entity';
import { RewardRedemption } from './reward-redemption.entity';
import { Customer } from '../customers/customer.entity';
import { Business } from '../business/business.entity';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reward, RewardRedemption, Customer, Business]),
    AuthModule,
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
