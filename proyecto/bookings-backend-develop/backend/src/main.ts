import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Generamos una palabra aleatoria cada vez que el servidor arranca o se refresca
  const palabras = ['Frontend2026', 'NestJS_Secure', 'Token_Alpha', 'Booking_Master', 'Crypto_Safe'];
  const palabraAleatoria = palabras[Math.floor(Math.random() * palabras.length)];

  // 1. CORS - permitir peticiones del frontend
  app.enableCors();

  // 2. Proteger solo el Swagger con basicAuth
  app.use('/api-docs', basicAuth({
    challenge: true,
    users: { 'admin': 'password123' },
    unauthorizedResponse: 'Requiere autenticación estricta.',
  }));

  // 3. CONFIGURACIÓN DE SWAGGER
  const config = new DocumentBuilder()
    .setTitle('API de Reservas')
    .setDescription(`🔑 **Tu palabra secreta generada para esta sesión es:** \`${palabraAleatoria}\`. Cópiala y pégala en el botón **Authorize** de abajo.`)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: `Escribe aquí la palabra aleatoria actual: ${palabraAleatoria}`,
        in: 'header',
      },
      'token-login',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 4. Redirigir la raíz al Swagger
  app.getHttpAdapter().get('/', (req: any, res: any) => {
    res.redirect('/api-docs');
  });

  // 5. Montar el Swagger
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      docExpansion: 'none',
    }
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`Servidor protegido en ejecución.`);
}
bootstrap();
