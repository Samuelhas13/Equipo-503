import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
 
export class CreateBusinessDto {
  /** Solo letras, números, espacios, tildes, guión, &, coma y punto. Mín 2, máx 100. */
  @ApiProperty({ example: 'Peluquería Nova', description: 'Nombre de la empresa' })
  @MinLength(2, { message: 'name debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'name no puede superar 100 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s\-'&,.]+$/, {
    message: 'name solo puede contener letras, números, espacios y guiones',
  })
  name: string;
 
  @ApiProperty({ example: 'Belleza', description: 'Categoría de la empresa' })
  @MinLength(2, { message: 'category debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'category no puede superar 100 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s\-'&,.]+$/, {
    message: 'category solo puede contener letras, números, espacios y guiones',
  })
  category: string;
 
  /** Email estándar con validación de clase-validator */
  @ApiProperty({ example: 'contacto@empresa.com', description: 'Email de contacto (único)' })
  @IsEmail({}, { message: 'email no tiene un formato válido (ej. contacto@empresa.com)' })
  @MaxLength(150, { message: 'email no puede superar 150 caracteres' })
  email: string;
 
  /** Teléfono: prefijo opcional (+) + 9-15 dígitos */
  @ApiProperty({ example: '600123456', description: 'Teléfono de contacto' })
  @Matches(/^\+?\d{9,15}$/, {
    message: 'phone debe contener entre 9 y 15 dígitos y puede incluir prefijo (+)',
  })
  phone: string;

  /** Descripción opcional, máx 300 caracteres */
  @ApiProperty({
    example: 'Abierto de lunes a viernes de 9h a 20h.',
    description: 'Descripción opcional',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'description debe ser texto' })
  @MaxLength(300, { message: 'description no puede superar 300 caracteres' })
  description?: string;
}
