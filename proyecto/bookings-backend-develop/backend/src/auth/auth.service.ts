import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { BusinessesService } from '../businesses/businesses.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly customersService: CustomersService,
    private readonly businessesService: BusinessesService,
  ) {}

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const inputPassword = loginDto.password;

    // 1. Check if it's the system administrator
    if (email === 'admin@bookflow.com') {
      if (inputPassword !== '123456') {
        throw new UnauthorizedException('La contraseña ingresada es incorrecta');
      }
      return {
        id: 999,
        name: 'Administrador de Sistema',
        email: 'admin@bookflow.com',
        role: 'admin',
      };
    }

    // 2. Check if it's a business (empresa)
    const business = await this.businessesService.findByEmail(email);
    if (business) {
      if (business.password !== inputPassword) {
        throw new UnauthorizedException('La contraseña ingresada es incorrecta');
      }
      return {
        id: business.id,
        name: business.name,
        email: business.email,
        role: 'empresa',
        businessId: business.id,
      };
    }

    // 3. Check if it's a customer (usuario)
    const customer = await this.customersService.findByEmail(email);
    if (customer) {
      if (customer.password !== inputPassword) {
        throw new UnauthorizedException('La contraseña ingresada es incorrecta');
      }
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        role: 'usuario',
        customerId: customer.id,
      };
    }

    // 4. Not found
    throw new UnauthorizedException('El correo electrónico ingresado no está registrado');
  }
}
