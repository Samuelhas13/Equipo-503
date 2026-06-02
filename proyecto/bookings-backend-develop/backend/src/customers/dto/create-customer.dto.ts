import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, IsNumber } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  nombre!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido no puede estar vacío' })
  apellido!: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email!: string;

  @ApiProperty({ example: '600123456' })
  @IsString()
  @Matches(/^\+?\d{9,15}$/, {
    message: 'El teléfono debe contener solo dígitos y puede incluir prefijo +',
  })
  @IsNotEmpty({ message: 'El teléfono no puede estar vacío' })
  numero!: string;

  @ApiProperty({ example: 1, description: 'ID de la empresa asociada' })
  @IsNumber()
  @IsOptional()
  businessId?: number;
}
