import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Juan', description: 'Nombre' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  nombre!: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido no puede estar vacío' })
  apellido!: string;

  @ApiProperty({ example: 'juan@example.com', description: 'Email' })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email!: string;

  @ApiProperty({ example: '600123456', description: 'Numero' })
  @IsString()
  @IsNotEmpty({ message: 'El teléfono no puede estar vacío' })
  numero!: string;

  @ApiPropertyOptional({ example: 1, description: 'Id business' })
  @IsNumber()
  @IsOptional()
  businessId?: number;
}
