# 🚀 Bootcamp Micro Lab 2026

## 📌 1. Objeto del pliego

El presente pliego define el marco de trabajo de la convocatoria **Bootcamp Micro Lab**, con una duración aproximada de un mes.

Durante este periodo, los participantes deberán desarrollar una **aplicación real de gestión de reservas** para distintos tipos de negocio, partiendo de una base técnica existente:

* Repositorio frontend
* Repositorio backend

🎯 **Objetivo principal:**
Trabajar en un entorno cercano al profesional, comprendiendo una arquitectura **fullstack**, completando funcionalidades e integrando correctamente todos los componentes del sistema.

---

## 👥 2. Organización del trabajo

* Trabajo en equipos
* Distribución interna de:

  * Roles
  * Responsabilidades
  * Tareas técnicas

Se valorará especialmente:

* Organización
* Comunicación
* Seguimiento del progreso
* Toma de decisiones técnicas

---

## 📂 3. Repositorios base

Los repositorios base están disponibles en:

👉 https://github.com/bootcamp-micro-2026

Incluyen:

* **Frontend** → Aplicación administrativa en Next.js
* **Backend** → API en NestJS

⚠️ **Importante:**

* NO modificar directamente estos repositorios
* Usarlos solo como base (clonar/descargar)

---

## 🛠️ 4. Metodología de trabajo

Cada equipo deberá:

* Clonar los repositorios base
* Crear sus propios repositorios:

  * Opción 1: Monorepo
  * Opción 2: Frontend + Backend separados

📢 Requisitos:

* Repositorios públicos
* Mantenerlos actualizados durante todo el programa

---

## ⚙️ 5. Alcance funcional y técnico

### 🔹 5.1 Backend

* Ampliar API REST existente
* Diseñar/mejorar base de datos
* Validación con DTOs
* Uso de Swagger para documentación y testing
* Añadir nuevas entidades/endpoints si es necesario

---

### 🔹 5.2 Frontend

* Conectar completamente con el backend
* Implementar dashboard funcional
* Completar:

  * Clientes
  * Pagos
* Mejorar:

  * UX
  * Navegación
  * Estados y feedback

---

## 🧰 6. Stack tecnológico

### Backend

* NestJS
* TypeORM
* SQLite
* Swagger
* class-validator

### Frontend

* Next.js 16
* React 19
* TypeScript
* Fetch API
* CSS propio

---

## 📊 7. Estado actual del sistema

### Backend

CRUD completo de reservas:

* GET /appointments
* GET /appointments/:id
* POST /appointments
* PATCH /appointments/:id
* DELETE /appointments/:id

✔ Base de datos: SQLite
✔ Validación: DTOs
✔ Documentación: http://localhost:3000/api

---

### Frontend

* Panel administrativo funcional
* Gestión de reservas:

  * Listar
  * Crear
  * Editar
  * Eliminar

⚠️ Pendiente:

* Dashboard
* Customers
* Payments (datos estáticos)

---

## 🔄 8. Flujo de desarrollo recomendado

Ejecutar en paralelo:

### Backend

```
npm run start:dev
```

📍 http://localhost:3000

### Frontend

```
npm run dev
```

📍 http://localhost:3001

---

## 🗄️ 9. Base de datos

* SQLite local
* No requiere servidor externo
* Generación automática con TypeORM

Se espera:

* Comprensión del modelo actual
* Ampliación según necesidades

---

## 🧑‍💻 10. Requisitos técnicos

* Node.js 18 o superior
* npm
* Git

📚 Recomendado:

* Conocimientos básicos de JavaScript

---

## 🎯 11. Objetivos de aprendizaje

* Comprensión de código existente
* Desarrollo sobre base real
* Integración frontend/backend
* Uso de herramientas profesionales:

  * Git
  * Swagger
* Trabajo en equipo
* Resolución de problemas reales

---

## 📦 12. Entregables

Cada equipo deberá entregar:

* Repositorio(s) público(s)
* Código funcional
* Aplicación integrada
* Base de datos operativa

🎤 Presentación:

* Demo funcional
* Explicación técnica
* Organización del equipo

---

## 🧠 13. Consideraciones finales

Se valorará:

* Colaboración
* Iniciativa
* Calidad técnica
* Organización del código
* Funcionalidad final

💡 Se permiten mejoras y nuevas funcionalidades si aportan valor.

---

## 🧩 Resumen

Partiendo de un proyecto real, los equipos deberán:

* Colaborar
* Mejorar la base existente
* Construir una solución funcional

🎯 **Resultado final:** una aplicación completa, propia y evaluable.
