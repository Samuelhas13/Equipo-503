import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@ApiTags('businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  @ApiOkResponse({ description: 'Listado de empresas' })
  findAll() {
    return this.businessesService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalle de una empresa' })
  @ApiNotFoundResponse({ description: 'Empresa no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.businessesService.findOne(id);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Empresa creada' })
  @ApiConflictResponse({ description: 'Email ya registrado' })
  create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessesService.create(createBusinessDto);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Empresa actualizada' })
  @ApiNotFoundResponse({ description: 'Empresa no encontrada' })
  @ApiConflictResponse({ description: 'Email ya registrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessesService.update(id, updateBusinessDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Empresa eliminada' })
  @ApiNotFoundResponse({ description: 'Empresa no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.businessesService.remove(id);
  }
}
