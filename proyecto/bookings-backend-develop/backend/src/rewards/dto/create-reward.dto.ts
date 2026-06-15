import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';

export class CreateRewardDto {
  @ApiProperty({ example: '10% Descuento', description: 'Título del premio' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: 'Obtén 10% en tu próximo corte',
    description: 'Descripción',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'discount',
    enum: ['discount', 'gift'],
    description: 'Tipo de premio',
  })
  @IsEnum(['discount', 'gift'])
  type!: 'discount' | 'gift';

  @ApiProperty({
    example: 10,
    description: 'Porcentaje de descuento si aplica',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  discountValue?: number;

  @ApiProperty({ example: 500, description: 'Puntos necesarios para canjear' })
  @IsNumber()
  @IsNotEmpty()
  requiredPoints!: number;

  @ApiProperty({ example: 1, description: 'ID del negocio' })
  @IsNumber()
  @IsNotEmpty()
  businessId!: number;
}
