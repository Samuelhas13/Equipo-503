import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiConflictResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from './business.entity';

@ApiTags('businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Empresa creada exitosamente', type: Business })
  @ApiConflictResponse({ description: 'El email de la empresa ya existe' })
  @ApiBadRequestResponse({ description: 'Datos de empresa inválidos' })
  create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessesService.create(createBusinessDto);
  }

  @Get()
  @ApiOkResponse({ description: 'Listado completo de empresas', type: [Business] })
  findAll() {
    return this.businessesService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalle de una empresa específica', type: Business })
  @ApiNotFoundResponse({ description: 'Empresa no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.businessesService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Empresa modificada correctamente', type: Business })
  @ApiNotFoundResponse({ description: 'Empresa no encontrada' })
  @ApiBadRequestResponse({ description: 'Datos de modificación inválidos' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateBusinessDto: UpdateBusinessDto) {
    return this.businessesService.update(id, updateBusinessDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Empresa eliminada correctamente' })
  @ApiNotFoundResponse({ description: 'Empresa no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.businessesService.remove(id);
  }
}
