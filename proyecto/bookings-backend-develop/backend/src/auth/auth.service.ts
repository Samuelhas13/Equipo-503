import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';

export type UserRole = 'admin' | 'empresa' | 'usuario';

interface MockUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  businessId?: number;
  customerId?: number;
}

const MOCK_USERS: MockUser[] = [
  {
    id: 999,
    name: 'Administrador de Sistema',
    email: 'admin@bookflow.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: 1,
    name: 'Peluquería Nova',
    email: 'nova@bookflow.com',
    password: 'nova123',
    role: 'empresa',
    businessId: 1,
  },
  {
    id: 2,
    name: 'Restaurante Marea',
    email: 'marea@bookflow.com',
    password: 'marea123',
    role: 'empresa',
    businessId: 2,
  },
  {
    id: 1,
    name: 'Juan Pérez',
    email: 'juan@bookflow.com',
    password: 'juan123',
    role: 'usuario',
    customerId: 1,
  },
  {
    id: 2,
    name: 'María López',
    email: 'maria@bookflow.com',
    password: 'maria123',
    role: 'usuario',
    customerId: 2,
  },
];

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(loginDto: LoginDto) {
    const { email, password, role } = loginDto;

    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role,
    );

    if (!user || user.password !== password) {
      throw new UnauthorizedException(
        'Credenciales inválidas. Verifica tu email, contraseña y rol.',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
      customerId: user.customerId,
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
      name: payload.name,
      email: payload.email,
      role: payload.role,
      businessId: payload.businessId,
      customerId: payload.customerId,
    };
  }
}
