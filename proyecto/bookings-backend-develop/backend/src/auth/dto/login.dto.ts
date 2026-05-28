import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@bookflow.com' })
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email!: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @ApiProperty({ enum: ['admin', 'empresa', 'usuario'], example: 'admin' })
  @IsEnum(['admin', 'empresa', 'usuario'], {
    message: 'El rol debe ser admin, empresa o usuario',
  })
  role!: 'admin' | 'empresa' | 'usuario';
}
