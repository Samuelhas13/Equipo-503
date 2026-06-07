import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({
    example: 'Peluquería Nova',
    description: 'Nombre de la empresa',
  })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({
    example: 'Calle Mayor 123',
    description: 'Dirección de la empresa',
  })
  @IsString()
  @IsNotEmpty()
  direccion!: string;
}
