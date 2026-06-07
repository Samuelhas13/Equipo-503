import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UserRole } from '../users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  create(createBusinessDto: CreateBusinessDto) {
    const business = this.businessRepository.create(createBusinessDto);
    return this.businessRepository.save(business);
  }

  findAll(currentUser?: JwtPayload) {
    if (currentUser?.role === UserRole.BUSINESS) {
      return this.businessRepository.find({
        where: { id: currentUser.businessId },
      });
    }
    return this.businessRepository.find();
  }

  async findOne(id: number, currentUser?: JwtPayload) {
    const business = await this.businessRepository.findOneBy({ id });
    if (!business) {
      throw new NotFoundException(`Business #${id} not found`);
    }
    if (
      currentUser?.role === UserRole.BUSINESS &&
      business.id !== currentUser.businessId
    ) {
      throw new ForbiddenException('You can only access your own business');
    }
    return business;
  }

  async update(
    id: number,
    updateBusinessDto: UpdateBusinessDto,
    currentUser?: JwtPayload,
  ) {
    const business = await this.findOne(id, currentUser);
    const updated = this.businessRepository.merge(business, updateBusinessDto);
    return this.businessRepository.save(updated);
  }

  async remove(id: number, currentUser?: JwtPayload) {
    const business = await this.findOne(id, currentUser);
    await this.businessRepository.remove(business);
    return { message: `Business #${id} deleted successfully` };
  }
}
