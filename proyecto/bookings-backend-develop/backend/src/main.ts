import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Generamos una palabra aleatoria cada vez que el servidor arranca o se refresca
  const palabras = [
    'Frontend2026',
    'NestJS_Secure',
    'Token_Alpha',
    'Booking_Master',
    'Crypto_Safe',
  ];
  const palabraAleatoria =
    palabras[Math.floor(Math.random() * palabras.length)];

  // 1. CORS - permitir peticiones del frontend
  app.enableCors();

  // 2. CONFIGURACIÓN DE SWAGGER
  const config = new DocumentBuilder()
    .setTitle('API de Reservas')
    .setDescription(
      '🔑 API de Reservas: acceda con su token JWT para autenticar.',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: `Escribe aquí la palabra aleatoria actual: ${palabraAleatoria}`,
      in: 'header',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 4. Redirigir la raíz al Swagger
  app.getHttpAdapter().get('/', (req: Request, res: Response) => {
    res.redirect('/api-docs');
  });

  // 5. Montar el Swagger
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      docExpansion: 'none',
    },
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`Servidor protegido en ejecución.`);
}
void bootstrap();
