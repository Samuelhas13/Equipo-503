import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'Admin', description: 'Nombre' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ example: 'Principal', description: 'Apellido' })
  @IsString()
  @IsNotEmpty()
  apellido!: string;

  @ApiProperty({ example: 'admin@bookflow.com', description: 'Email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '600123456', description: 'Numero' })
  @IsString()
  numero!: string;

  @ApiProperty({ example: 'admin123', description: 'Password' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ example: 1, description: 'Id business' })
  @IsNumber()
  @IsOptional()
  businessId?: number;

  @ApiPropertyOptional({ enum: UserRole, description: 'Rol (customer, business, admin)', default: UserRole.CUSTOMER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}