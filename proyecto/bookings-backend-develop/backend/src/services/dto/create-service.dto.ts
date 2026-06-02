import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Corte de Pelo', description: 'Nombre del servicio' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ example: 15.5, description: 'Precio del servicio' })
  @IsNumber()
  precio!: number;

  @ApiProperty({ example: 1, description: 'ID de la empresa' })
  @IsNumber()
  businessId!: number;
}
