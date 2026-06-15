import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from './jwt-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiCreatedResponse({
    description: 'Login exitoso. Devuelve el JWT y los datos del usuario.',
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiCreatedResponse({
    description:
      'Registro de cliente exitoso. Devuelve los datos del usuario creado.',
  })
  @ApiConflictResponse({ description: 'El email ya está en uso' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Perfil del usuario autenticado' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado' })
  getProfile(@Request() req: { user: JwtPayload }) {
    return this.authService.getProfile(req.user);
  }
}
