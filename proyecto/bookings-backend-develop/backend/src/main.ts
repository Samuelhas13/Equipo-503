/**
 * El archivo main.ts es el punto de entrada principal de la aplicación backend.
 * Se encarga de inicializar la instancia de la aplicación NestJS, configurar
 * validaciones globales (Pipes), establecer la configuración de CORS, inicializar
 * la documentación de Swagger y levantar el servidor en el puerto especificado.
 */
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth = require('express-basic-auth');
import { AppModule } from './app.module';

async function bootstrap() {
  // 1. Crea la instancia de la aplicación NestJS utilizando el módulo raíz (AppModule)
  const app = await NestFactory.create(AppModule);

  // 2. Configuración de CORS: Permite que el frontend pueda consumir esta API sin ser bloqueado por el navegador
  app.enableCors({
    origin: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL]
      : ['http://localhost:3000', 'http://localhost:3001'],
  });

  // 3. Configuración de validación global: Obliga a que todas las peticiones cumplan las reglas de los DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina automáticamente del payload cualquier propiedad que no esté en el DTO
      transform: true, // Convierte los datos entrantes (ej. strings) a los tipos definidos en el DTO (ej. numbers, booleans)
      forbidNonWhitelisted: true, // Lanza un error si el usuario envía una propiedad no permitida en lugar de solo ignorarla
    }),
  );

  // 4. Configuración de Swagger: Genera automáticamente la documentación visual de los endpoints de la API
  const config = new DocumentBuilder()
    .setTitle('Booking Management API')
    .setDescription('API MVP para gestión de reservas de comercios')
    .setVersion('1.0')
    .addBearerAuth() // Añade el candado en la UI de Swagger preparándolo para futura autenticación por token
    .build();

  // 5. Crea el documento Swagger y lo expone en la ruta '/api' (http://localhost:3000/api)
  const document = SwaggerModule.createDocument(app, config);

  // Protege la ruta de Swagger con Basic Auth si se configuran credenciales en las variables de entorno
  // Define SWAGGER_USER y SWAGGER_PASS en tu entorno (ej.: .env o variables del servidor)
  if (process.env.SWAGGER_USER && process.env.SWAGGER_PASS) {
    app.use(
      '/api',
      basicAuth({
        challenge: true,
        users: { [process.env.SWAGGER_USER]: process.env.SWAGGER_PASS },
      }),
    );
    console.log(`Swagger UI protegido por Basic Auth (user=${process.env.SWAGGER_USER})`);
  } else {
    console.log('Swagger UI sin protección. Define SWAGGER_USER y SWAGGER_PASS para activar Basic Auth.');
  }

  SwaggerModule.setup('api', app, document);

  // 6. Define el puerto desde las variables de entorno o usa 3000 por defecto y arranca el servidor
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();