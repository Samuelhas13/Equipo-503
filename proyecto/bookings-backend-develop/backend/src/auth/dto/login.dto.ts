import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@bookflow.com', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Contraseña del usuario' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}
