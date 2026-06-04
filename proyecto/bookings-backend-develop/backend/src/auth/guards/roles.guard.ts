import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_ALIASES: Record<string, string> = {
  admin: 'admin',
  business: 'empresa',
  customer: 'usuario',
  empresa: 'business',
  usuario: 'customer',
};

function normalizeRole(role: string): string {
  return String(role).toLowerCase();
}

function rolesMatch(roleA: string, roleB: string): boolean {
  const normalizedA = normalizeRole(roleA);
  const normalizedB = normalizeRole(roleB);

  if (normalizedA === normalizedB) return true;
  return (
    ROLE_ALIASES[normalizedA] === normalizedB ||
    ROLE_ALIASES[normalizedB] === normalizedA
  );
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    const hasRole =
      user &&
      requiredRoles.some((requiredRole) =>
        rolesMatch(requiredRole, user.role),
      );

    if (!user || !hasRole) {
      throw new ForbiddenException(
        `Acceso denegado. Roles requeridos: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
