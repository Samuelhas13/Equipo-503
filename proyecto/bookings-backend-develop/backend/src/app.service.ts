/**
 * AppService contiene la lógica de negocio general y utilidades
 * de nivel raíz. Aquí se provee la funcionalidad de verificación
 * de estado para la ruta de healthcheck.
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'up',
      timestamp: new Date().toISOString(),
    };
  }
}
