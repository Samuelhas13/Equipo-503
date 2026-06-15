import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  nombre!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido no puede estar vacío' })
  apellido!: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email!: string;

  @ApiProperty({ example: '600123456' })
  @IsString()
  @Matches(/^\+?\d{9,15}$/, {
    message: 'El teléfono debe contener solo dígitos y puede incluir prefijo +',
  })
  @IsNotEmpty({ message: 'El teléfono no puede estar vacío' })
  numero!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;
}
