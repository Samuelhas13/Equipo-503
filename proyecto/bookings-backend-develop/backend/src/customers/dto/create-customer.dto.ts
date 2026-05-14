/**
 * CreateCustomerDto.
 * Define los datos esperados y obligatorios al crear un cliente nuevo.
 * Usa class-validator para asegurar que el email tenga el formato correcto, etc.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  name: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email: string;

  @ApiProperty({ example: '+34 600 123 456' })
  @IsString()
  @IsNotEmpty({ message: 'El teléfono no puede estar vacío' })
  phone: string;
}
