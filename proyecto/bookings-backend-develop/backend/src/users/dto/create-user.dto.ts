import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'Admin', description: 'Nombre del usuario' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ example: 'Principal', description: 'Apellido del usuario' })
  @IsString()
  @IsNotEmpty()
  apellido!: string;

  @ApiProperty({ example: 'admin@bookflow.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '600123456', description: 'Teléfono' })
  @IsString()
  numero!: string;

  @ApiProperty({
    example: 'admin123',
    description: 'Contraseña en texto plano',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ enum: UserRole, default: UserRole.CUSTOMER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    example: 1,
    description: 'ID de la empresa (si aplica)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  businessId?: number;
}
