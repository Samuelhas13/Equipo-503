/**
 * CreateCustomerDto.
 * Define los datos esperados y obligatorios al crear un cliente nuevo.
 * Usa class-validator para asegurar que el email tenga el formato correcto, etc.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/, {
    message: 'El nombre debe contener solo letras, espacios, apóstrofos o guiones',
  })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  name!: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email!: string;

  @ApiProperty({ example: '600123456' })
  @IsString()
  @Matches(/^\+?\d{9,15}$/, {
    message: 'El teléfono debe contener solo dígitos y puede incluir prefijo +',
  })
  @IsNotEmpty({ message: 'El teléfono no puede estar vacío' })
  phone!: string;

  @ApiProperty({ example: 'Peluquería Nova' })
  @IsString()
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s&'"\-,.()]+$/, {
    message: 'El nombre del negocio solo puede contener caracteres válidos',
  })
  @IsNotEmpty({ message: 'El nombre del negocio no puede estar vacío' })
  business!: string;

  @ApiProperty({ example: 'Hoy · 09:00', required: false })
  @IsString()
  @IsOptional()
  nextBooking?: string;
}
