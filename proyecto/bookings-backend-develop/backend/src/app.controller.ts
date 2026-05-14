/**
 * AppController maneja las rutas base de la aplicación.
 * Principalmente se utiliza para exponer un endpoint de comprobación
 * de estado de salud (healthcheck) útil para monitorización.
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOkResponse({ description: 'Devuelve el estado de salud de la API' })
  getHealth() {
    return this.appService.getHealth();
  }
}
