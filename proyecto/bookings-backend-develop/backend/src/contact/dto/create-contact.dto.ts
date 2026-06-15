import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
} from 'class-validator';
import { ContactSubject } from '../contact.entity';

export class CreateContactDto {
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del remitente',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'juan.perez@example.com',
    description: 'Correo electrónico del remitente',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    enum: ContactSubject,
    default: ContactSubject.SUPPORT,
    description: 'Asunto de la consulta',
  })
  @IsEnum(ContactSubject)
  subject: ContactSubject;

  @ApiProperty({
    example: 'Hola, tengo una duda sobre la facturación de mi cuenta...',
    description: 'Mensaje de la consulta',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
