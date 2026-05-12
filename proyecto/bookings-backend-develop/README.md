# Bookings Backend

Backend API para gestión de reservas, construido con **NestJS**, **TypeORM** y **SQLite**. Actualmente permite **listar reservas**, **consultar una reserva por ID**, **crear**, **editar** y **eliminar reservas**, con validación mediante DTOs y documentación Swagger.

## Visión general

Este repositorio contiene la parte backend del proyecto de gestión de reservas. La aplicación expone una API REST sencilla sobre reservas y utiliza una base de datos SQLite local, lo que facilita su puesta en marcha en entorno local sin necesidad de instalar un servidor de base de datos independiente.

## Stack técnico

- **NestJS** como framework backend.
- **TypeORM** como capa ORM.
- **SQLite** como base de datos local en archivo.
- **Swagger** para explorar la API desde navegador.
- **class-validator** y `ValidationPipe` para validar las peticiones de entrada.

## Estructura principal

```text
backend/
├─ data/
│  └─ database.sqlite
├─ src/
│  ├─ appointments/
│  │  ├─ dto/
│  │  │  ├─ create-appointment.dto.ts
│  │  │  └─ update-appointment.dto.ts
│  │  ├─ appointment.entity.ts
│  │  ├─ appointments.controller.ts
│  │  ├─ appointments.module.ts
│  │  └─ appointments.service.ts
│  ├─ app.module.ts
│  └─ main.ts
├─ test/
└─ package.json
```

## Funcionalidades actuales

La API expone un módulo `appointments` con cinco endpoints:

- `GET /appointments` → devuelve el listado de reservas ordenado por fecha y hora.
- `GET /appointments/:id` → devuelve una reserva concreta por ID.
- `POST /appointments` → crea una nueva reserva.
- `PATCH /appointments/:id` → actualiza parcialmente una reserva existente.
- `DELETE /appointments/:id` → elimina una reserva por ID.

La entidad `Appointment` guarda actualmente estos campos:

- `id`
- `date`
- `time`
- `status`
- `customerId`
- `businessId`
- `serviceName`

El campo `status` puede tomar estos valores:

- `pending`
- `confirmed`
- `paid`

## Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

- **Node.js 18 o superior**; el proyecto usa TypeScript y tooling moderno de NestJS.
- **npm**
- **Git**

Puedes comprobarlo con:

```bash
node -v
npm -v
git --version
```

## Cómo descargar el proyecto

### Opción 1: clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd bookings-backend-Base/backend
```

### Opción 2: descargar ZIP

1. En GitHub, pulsa **Code**.
2. Pulsa **Download ZIP**.
3. Descomprime el proyecto.
4. Entra en la carpeta `bookings-backend-Base/backend`.

## Instalación

Ejecuta:

```bash
npm install
```

Este comando instalará NestJS, TypeORM, SQLite, Swagger y el resto de dependencias definidas en `package.json`.

## Cómo ejecutar el backend

### Modo desarrollo

```bash
npm run start:dev
```

Este modo recompila automáticamente al guardar cambios.

### Otros scripts útiles

```bash
npm run start
npm run build
npm run start:prod
npm run lint
npm run test
npm run test:e2e
```

## URL de acceso

Cuando el backend esté levantado, normalmente estará disponible en:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api`

## Base de datos

La base de datos es un archivo SQLite local:

```text
backend/data/database.sqlite
```

TypeORM está configurado con `type: 'sqlite'`, `database: 'data/database.sqlite'`, `autoLoadEntities: true` y `synchronize: true`, por lo que en desarrollo el esquema se genera automáticamente a partir de las entidades del proyecto.

### ¿Hay que levantar la base de datos manualmente?

No. SQLite funciona como archivo local, así que **no necesitas arrancar un servidor de base de datos** como MySQL o PostgreSQL. Si el archivo no existe, TypeORM lo creará al levantar la app.

### Cómo reiniciar la base de datos

Si quieres empezar desde cero:

1. Detén el backend.
2. Borra el archivo `data/database.sqlite`.
3. Vuelve a ejecutar `npm run start:dev`.

Con `synchronize: true`, Nest y TypeORM recrearán la estructura a partir de la entidad actual.

## Cómo ver los datos de la base de datos

Tienes varias formas:

### Opción 1: usar Swagger

Abre:

```text
http://localhost:3000/api
```

Desde ahí puedes probar todos los endpoints directamente desde el navegador. Swagger genera la documentación a partir del código y de los decoradores de Nest.

### Opción 2: usar curl

Listar reservas:

```bash
curl http://localhost:3000/appointments
```

Crear una reserva:

```bash
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-04-21","time":"10:30","status":"pending","customerId":1,"businessId":1,"serviceName":"Corte de pelo"}'
```

Ver una reserva por ID:

```bash
curl http://localhost:3000/appointments/1
```

Editar una reserva:

```bash
curl -X PATCH http://localhost:3000/appointments/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed","time":"11:00"}'
```

Eliminar una reserva:

```bash
curl -X DELETE http://localhost:3000/appointments/1
```

### Opción 3: abrir el archivo SQLite

Puedes abrir `data/database.sqlite` con herramientas como:

- **DB Browser for SQLite**
- extensiones de VS Code para SQLite
- clientes compatibles con SQLite

Así podrás inspeccionar tablas y registros directamente.

## Validación de datos

El backend usa un `ValidationPipe` global con estas opciones:

- `whitelist: true`
- `transform: true`
- `forbidNonWhitelisted: true`

Esto significa:

- solo se aceptan los campos definidos en el DTO
- se transforman tipos cuando es posible
- si llega un campo no permitido, la petición falla

El DTO `CreateAppointmentDto` exige:

- `date` como string
- `time` como string
- `status` como enum válido
- `customerId` como entero
- `businessId` como entero
- `serviceName` como string

El DTO `UpdateAppointmentDto` permite actualizar esos mismos campos de forma parcial.

## CORS y conexión con el frontend

Si el frontend se ejecuta en otro puerto, por ejemplo `http://localhost:3001`, el backend debe permitir peticiones CORS mediante `app.enableCors(...)` en `main.ts`.

Ejemplo recomendado:

```ts
app.enableCors({
  origin: 'http://localhost:3001',
});
```

## Flujo básico de uso

1. Arranca el backend con `npm run start:dev`.
2. Abre Swagger en `http://localhost:3000/api`.
3. Comprueba que `GET /appointments` responde.
4. Crea una reserva con `POST /appointments`.
5. Edita una reserva con `PATCH /appointments/:id`.
6. Elimina una reserva con `DELETE /appointments/:id`.
7. Vuelve a llamar a `GET /appointments` para verificar los cambios.

## Problemas frecuentes

### El backend no arranca

Revisa:

- que `npm install` haya terminado correctamente
- que estás dentro de `bookings-backend-Base/backend`
- que tu versión de Node es suficientemente reciente

### Error al crear reservas

Revisa que el body enviado cumpla el DTO:

```json
{
  "date": "2026-04-21",
  "time": "10:30",
  "status": "pending",
  "customerId": 1,
  "businessId": 1,
  "serviceName": "Corte de pelo"
}
```

### Error al editar reservas

Comprueba que el ID exista y que el body contenga campos válidos:

```json
{
  "status": "confirmed",
  "time": "11:00"
}
```

### Error al eliminar reservas

Comprueba que el ID que estás intentando eliminar existe. Si no existe, el backend devolverá un error 404.

### No veo datos en la base

Si `GET /appointments` devuelve `[]`, simplemente significa que todavía no hay registros guardados. Crea una reserva con Swagger o curl y vuelve a consultar.

## Scripts disponibles

```json
{
  "build": "nest build",
  "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
  "test:e2e": "jest --config ./test/jest-e2e.json"
}
```

## Estado actual del proyecto

Este backend proporciona un CRUD completo sobre reservas: listar, consultar por ID, crear, editar y eliminar, con persistencia local en SQLite, validación de entradas y documentación accesible desde Swagger.
