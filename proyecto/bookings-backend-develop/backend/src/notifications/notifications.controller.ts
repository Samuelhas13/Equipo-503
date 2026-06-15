import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Notification } from './notification.entity';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOkResponse({
    description: 'Obtener notificaciones del usuario autenticado',
    type: [Notification],
  })
  findAll(@Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.notificationsService.findAllForUser(req.user.sub as number);
  }

  @Patch(':id/read')
  @ApiOkResponse({
    description: 'Marcar una notificación como leída',
    type: Notification,
  })
  @ApiNotFoundResponse({ description: 'Notificación no encontrada' })
  markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.notificationsService.markAsRead(id, req.user.sub as number);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Eliminar una notificación' })
  @ApiNotFoundResponse({ description: 'Notificación no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.notificationsService.remove(id, req.user.sub as number);
  }
}
