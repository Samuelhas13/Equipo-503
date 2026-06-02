import { UserRole } from '../users/user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  nombre: string;
  apellido: string;
  role: UserRole;
  businessId?: number;
  iat?: number;
  exp?: number;
}
