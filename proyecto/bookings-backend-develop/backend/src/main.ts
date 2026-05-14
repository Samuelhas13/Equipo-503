/**
 * El archivo main.ts es el punto de entrada principal de la aplicación backend.
 * Se encarga de inicializar la instancia de la aplicación NestJS, configurar
 * validaciones globales (Pipes), establecer la configuración de CORS, inicializar
 * la documentación de Swagger y levantar el servidor en el puerto especificado.
 */
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Booking Management API')
    .setDescription('API MVP para gestión de reservas de comercios')
    .setVersion('1.0')
    .addBearerAuth() // Soporte básico para autenticación en el futuro
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();