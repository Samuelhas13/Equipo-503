import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Peluquería Nova' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la empresa no puede estar vacío' })
  name!: string;

  @ApiProperty({ example: 'Belleza & Estética' })
  @IsString()
  @IsNotEmpty({ message: 'La categoría no puede estar vacía' })
  category!: string;

  @ApiProperty({ example: 'contacto@peluquerianova.com' })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @IsNotEmpty({ message: 'El email no puede estar vacío' })
  email!: string;

  @ApiProperty({ example: '600123456' })
  @IsString()
  @Matches(/^\+?\d{9,15}$/, {
    message: 'El teléfono debe contener solo dígitos y puede incluir prefijo +',
  })
  @IsNotEmpty({ message: 'El teléfono no puede estar vacío' })
  phone!: string;

  @ApiProperty({ example: 'Cortes, peinados y tratamientos capilares de vanguardia.', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
