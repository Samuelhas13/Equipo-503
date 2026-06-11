import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Reward } from './reward.entity';
import { RewardRedemption } from './reward-redemption.entity';
import { Customer } from '../customers/customer.entity';
import { Business } from '../business/business.entity';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UserRole } from '../users/user.entity';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward)
    private readonly rewardsRepository: Repository<Reward>,
    @InjectRepository(RewardRedemption)
    private readonly redemptionsRepository: Repository<RewardRedemption>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  // ==========================================
  // LOGICA DE REWARDS (PREMIOS DISPONIBLES)
  // ==========================================

  async create(createRewardDto: CreateRewardDto, currentUser: JwtPayload) {
    if (currentUser.role === UserRole.BUSINESS) {
      createRewardDto.businessId = currentUser.businessId!;
    }

    const business = await this.businessRepository.findOneBy({
      id: createRewardDto.businessId,
    });

    if (!business) {
      throw new NotFoundException(`No existe la empresa con id ${createRewardDto.businessId}`);
    }

    const reward = this.rewardsRepository.create({
      ...createRewardDto,
      business,
    });

    return this.rewardsRepository.save(reward);
  }

  findAll(businessId?: number, currentUser?: JwtPayload) {
    const where: FindOptionsWhere<Reward> = {};

    if (currentUser?.role === UserRole.BUSINESS) {
      where.business = { id: currentUser.businessId };
    } else if (businessId) {
      where.business = { id: businessId };
      where.isActive = true;
    }

    return this.rewardsRepository.find({
      where,
      order: { requiredPoints: 'ASC' },
    });
  }

  async findOne(id: number, currentUser?: JwtPayload) {
    const reward = await this.rewardsRepository.findOne({
      where: { id },
      relations: ['business'],
    });

    if (!reward) {
      throw new NotFoundException(`No existe el premio con id ${id}`);
    }

    if (
      currentUser?.role === UserRole.BUSINESS &&
      reward.business?.id !== currentUser.businessId
    ) {
      throw new ForbiddenException('Solo puedes acceder a los premios de tu empresa');
    }

    return reward;
  }

  async update(id: number, updateRewardDto: UpdateRewardDto, currentUser: JwtPayload) {
    const reward = await this.findOne(id, currentUser);

    if (currentUser.role === UserRole.BUSINESS) {
      delete updateRewardDto.businessId; // Evitar que cambie de empresa
    }

    const updatedReward = this.rewardsRepository.merge(reward, updateRewardDto);
    return this.rewardsRepository.save(updatedReward);
  }

  async remove(id: number, currentUser: JwtPayload) {
    const reward = await this.findOne(id, currentUser);
    await this.rewardsRepository.remove(reward);
    return { message: `Premio con id ${id} eliminado correctamente` };
  }

  // ==========================================
  // LOGICA DE REDEMPTIONS (CANJES)
  // ==========================================

  async getMyPoints(currentUser: JwtPayload) {
    const customer = await this.customerRepository.findOne({
      where: { email: currentUser.email },
    });
    if (!customer) {
      throw new BadRequestException('El usuario no tiene un perfil de cliente registrado');
    }
    return { points: customer.puntos };
  }

  async claimReward(rewardId: number, currentUser: JwtPayload) {
    const reward = await this.rewardsRepository.findOne({
      where: { id: rewardId, isActive: true },
      relations: ['business'],
    });

    if (!reward) {
      throw new NotFoundException(`Premio activo con id ${rewardId} no encontrado`);
    }

    // Buscamos el cliente por su email
    const customer = await this.customerRepository.findOne({
      where: { email: currentUser.email },
    });

    if (!customer) {
      throw new BadRequestException('El usuario no tiene un perfil de cliente registrado');
    }

    const currentPoints = customer.puntos;

    // Validar puntos
    if (currentPoints < reward.requiredPoints) {
      throw new BadRequestException(
        `Puntos insuficientes. Tienes ${currentPoints} puntos y requieres ${reward.requiredPoints} para este premio.`,
      );
    }

    // Restar puntos al cliente
    customer.puntos -= reward.requiredPoints;
    await this.customerRepository.save(customer);

    // Generar código único de validación
    let code = '';
    let isUnique = false;
    while (!isUnique) {
      code = this.generateCode();
      const existing = await this.redemptionsRepository.findOneBy({ code });
      if (!existing) {
        isUnique = true;
      }
    }

    // Crear la redención
    const redemption = this.redemptionsRepository.create({
      customer,
      reward,
      code,
      status: 'pending',
    });

    return this.redemptionsRepository.save(redemption);
  }

  async validateRedemptionCode(code: string, currentUser: JwtPayload) {
    if (currentUser.role !== UserRole.BUSINESS) {
      throw new ForbiddenException('Solo las empresas pueden validar códigos de premios');
    }

    const redemption = await this.redemptionsRepository.findOne({
      where: { code },
      relations: ['reward', 'reward.business', 'customer'],
    });

    if (!redemption) {
      throw new NotFoundException(`No se encontró ningún canje con el código ${code}`);
    }

    if (redemption.reward?.business?.id !== currentUser.businessId) {
      throw new ForbiddenException('Este premio pertenece a otro negocio');
    }

    if (redemption.status === 'used') {
      throw new BadRequestException('Este premio ya ha sido utilizado previamente');
    }

    redemption.status = 'used';
    return this.redemptionsRepository.save(redemption);
  }

  async findCustomerRedemptions(currentUser: JwtPayload) {
    return this.redemptionsRepository.find({
      where: { customer: { email: currentUser.email } },
      relations: ['reward', 'reward.business'],
      order: { redeemedAt: 'DESC' },
    });
  }

  async findBusinessRedemptions(currentUser: JwtPayload) {
    if (currentUser.role !== UserRole.BUSINESS) {
      throw new ForbiddenException('Solo las empresas pueden ver los canjes recibidos');
    }

    return this.redemptionsRepository.find({
      where: { reward: { business: { id: currentUser.businessId } } },
      relations: ['customer', 'reward'],
      order: { redeemedAt: 'DESC' },
    });
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'PREM-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
