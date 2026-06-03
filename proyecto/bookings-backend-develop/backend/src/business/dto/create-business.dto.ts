import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Peluquería Nova', description: 'Nombre' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ example: 'Calle Mayor 123', description: 'Dirección' })
  @IsString()
  @IsNotEmpty()
  direccion!: string;
}