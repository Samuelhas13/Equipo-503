import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Business } from '../business/business.entity';
import { Customer } from '../customers/customer.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto, currentUser: JwtPayload) {
    if (currentUser.role === UserRole.BUSINESS) {
      if (createUserDto.role && createUserDto.role !== UserRole.CUSTOMER) {
        throw new ForbiddenException(
          'Business users can only create customers',
        );
      }
      createUserDto.role = UserRole.CUSTOMER;
      createUserDto.businessId = currentUser.businessId;
    }

    if (createUserDto.role === UserRole.BUSINESS) {
      if (!createUserDto.businessId) {
        throw new BadRequestException(
          'El usuario de tipo BUSINESS requiere asociarse a una empresa (businessId)',
        );
      }
    }

    if (createUserDto.businessId) {
      const businessExists = await this.dataSource
        .getRepository(Business)
        .findOneBy({ id: createUserDto.businessId });
      if (!businessExists) {
        throw new NotFoundException(
          `La empresa con id ${createUserDto.businessId} no existe`,
        );
      }
    }

    const existing = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const { password, businessId, ...rest } = createUserDto;

    // Hash password
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltOrRounds);

    const user = this.userRepository.create({
      ...rest,
      password: hashedPassword,
      business: businessId ? { id: businessId } : undefined,
    });

    return this.userRepository.save(user);
  }

  async registerCustomer(registerDto: any) {
    const { nombre, apellido, email, numero, password } = registerDto;

    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Ya existe una cuenta con este email');
    }

    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltOrRounds);

    const user = this.userRepository.create({
      nombre,
      apellido,
      email,
      numero,
      password: hashedPassword,
      role: UserRole.CUSTOMER,
    });
    const savedUser = await this.userRepository.save(user);

    const customerRepo = this.dataSource.getRepository(Customer);
    const customer = customerRepo.create({
      nombre,
      apellido,
      email,
      numero,
    });
    await customerRepo.save(customer);

    return savedUser;
  }

  findAll(currentUser: JwtPayload) {
    if (currentUser.role === UserRole.BUSINESS) {
      return this.userRepository.find({
        where: { business: { id: currentUser.businessId } },
        relations: ['business'],
      });
    }
    return this.userRepository.find({ relations: ['business'] });
  }

  async findOne(id: number, currentUser: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['business'],
    });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    if (
      currentUser.role === UserRole.BUSINESS &&
      user.business?.id !== currentUser.businessId
    ) {
      throw new ForbiddenException(
        'You can only access users from your business',
      );
    }

    if (currentUser.role === UserRole.CUSTOMER && user.id !== currentUser.sub) {
      throw new ForbiddenException('You can only access your own profile');
    }

    return user;
  }

  async findOneByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: ['business'],
    });
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUser: JwtPayload,
  ) {
    const user = await this.findOne(id, currentUser);

    if (currentUser.role === UserRole.CUSTOMER) {
      if (updateUserDto.role && updateUserDto.role !== UserRole.CUSTOMER) {
        throw new ForbiddenException('No puedes cambiar tu rol');
      }
      if (
        updateUserDto.businessId !== undefined &&
        updateUserDto.businessId !== user.business?.id
      ) {
        throw new ForbiddenException(
          'No puedes cambiar tu asociación de empresa',
        );
      }
    }

    if (currentUser.role === UserRole.BUSINESS) {
      updateUserDto.businessId = currentUser.businessId;
      if (updateUserDto.role && updateUserDto.role !== UserRole.CUSTOMER) {
        throw new ForbiddenException(
          'Business users can only modify customer roles',
        );
      }
      if (user.id !== currentUser.sub && user.role !== UserRole.CUSTOMER) {
        throw new ForbiddenException(
          'Business users can only modify their own profile or customer accounts',
        );
      }
    }

    const finalRole = updateUserDto.role || user.role;
    const finalBusinessId =
      updateUserDto.businessId !== undefined
        ? updateUserDto.businessId
        : user.business?.id;

    if (finalRole === UserRole.BUSINESS) {
      if (!finalBusinessId) {
        throw new BadRequestException(
          'El usuario de tipo BUSINESS requiere asociarse a una empresa (businessId)',
        );
      }
      const businessExists = await this.dataSource
        .getRepository(Business)
        .findOneBy({ id: finalBusinessId });
      if (!businessExists) {
        throw new NotFoundException(
          `La empresa con id ${finalBusinessId} no existe`,
        );
      }
    }

    const { password, businessId, ...rest } = updateUserDto;

    let hashedPassword = user.password;
    if (password) {
      const saltOrRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltOrRounds);
    }

    const updated = this.userRepository.merge(user, {
      ...rest,
      password: hashedPassword,
      business: businessId ? { id: businessId } : undefined,
    });

    return this.userRepository.save(updated);
  }

  async remove(id: number, currentUser: JwtPayload) {
    if (id === currentUser.sub) {
      throw new ForbiddenException(
        'No puedes eliminar tu propia cuenta de administrador',
      );
    }
    const user = await this.findOne(id, currentUser);
    if (
      currentUser.role === UserRole.BUSINESS &&
      user.role !== UserRole.CUSTOMER
    ) {
      throw new ForbiddenException(
        'Business users can only delete customer accounts',
      );
    }
    await this.userRepository.remove(user);
    return { message: `User #${id} deleted successfully` };
  }
}
