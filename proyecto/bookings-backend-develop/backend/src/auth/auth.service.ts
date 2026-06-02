import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      role: user.role,
      businessId: user.business?.id,
    };

    const access_token = this.jwtService.sign(payload);
    const { password: _pass, ...publicUser } = user;

    return {
      access_token,
      token_type: 'Bearer',
      expires_in: 8 * 60 * 60,
      user: publicUser,
    };
  }

  getProfile(payload: JwtPayload) {
    return {
      id: payload.sub,
      nombre: payload.nombre,
      apellido: payload.apellido,
      email: payload.email,
      role: payload.role,
      businessId: payload.businessId,
    };
  }
}
