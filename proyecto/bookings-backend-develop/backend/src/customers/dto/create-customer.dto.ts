import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'María López' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '600 123 456' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'maria@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Peluquería Nova' })
  @IsString()
  @IsNotEmpty()
  business: string;

  @ApiProperty({ example: 'Hoy · 09:00', required: false })
  @IsString()
  @IsOptional()
  nextBooking?: string;
}
