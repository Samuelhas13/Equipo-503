import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.userRepository.findOneBy({ email: createUserDto.email });
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

  findAll() {
    return this.userRepository.find({ relations: ['business'] });
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['business']
    });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async findOneByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: ['business']
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
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

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { message: `User #${id} deleted successfully` };
  }
}
