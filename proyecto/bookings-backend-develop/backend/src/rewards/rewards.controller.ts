import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { JwtPayload } from '../auth/jwt-payload.interface';

@ApiTags('rewards')
@ApiBearerAuth()
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOperation({ summary: 'Crear un nuevo premio (sólo empresas)' })
  create(
    @Body() createRewardDto: CreateRewardDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.rewardsService.create(createRewardDto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Listar premios' })
  @ApiQuery({
    name: 'businessId',
    required: false,
    type: Number,
    description: 'Filtrar premios por ID de empresa (Requerido para clientes)',
  })
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('businessId') businessId?: string,
  ) {
    const bId = businessId ? parseInt(businessId, 10) : undefined;
    return this.rewardsService.findAll(bId, req.user);
  }

  @Get('my-redemptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Ver mis premios canjeados (sólo clientes)' })
  findMyRedemptions(@Request() req: { user: JwtPayload }) {
    return this.rewardsService.findCustomerRedemptions(req.user);
  }

  @Get('my-points')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Ver mis puntos por negocio (sólo clientes)' })
  findMyPoints(@Request() req: { user: JwtPayload }) {
    return this.rewardsService.getMyPoints(req.user);
  }

  @Get('business-redemptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUSINESS)
  @ApiOperation({
    summary: 'Ver canjes recibidos por la empresa (sólo empresas)',
  })
  findBusinessRedemptions(@Request() req: { user: JwtPayload }) {
    return this.rewardsService.findBusinessRedemptions(req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Obtener un premio específico' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: JwtPayload },
  ) {
    return this.rewardsService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOperation({ summary: 'Actualizar un premio (sólo empresas)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRewardDto: UpdateRewardDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.rewardsService.update(id, updateRewardDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOperation({ summary: 'Eliminar un premio (sólo empresas)' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: JwtPayload },
  ) {
    return this.rewardsService.remove(id, req.user);
  }

  @Post('claim/:rewardId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Canjear un premio usando puntos (sólo clientes)' })
  claim(
    @Param('rewardId', ParseIntPipe) rewardId: number,
    @Request() req: { user: JwtPayload },
  ) {
    return this.rewardsService.claimReward(rewardId, req.user);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUSINESS)
  @ApiOperation({
    summary:
      'Validar un código de cupón de premio para marcarlo como utilizado',
  })
  validateCode(
    @Body('code') code: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.rewardsService.validateRedemptionCode(code, req.user);
  }
}
