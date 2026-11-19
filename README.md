# 🔨 Fixer Trades Marketplace - Backend API

Backend RESTful de alto rendimiento y arquitectura escalable para la plataforma **Fixer Trades Marketplace**, desarrollado bajo estándares de desarrollador senior con **Node.js, TypeScript, Express, PostgreSQL y el ORM Sequelize**.

Diseñado estrictamente con **Programación Orientada a Objetos (POO)**, principios **SOLID**, **Clean Code** y patrón **MVC Modular**.

---

## 🏛️ Principios de Arquitectura y Diseño

### 1. Programación Orientada a Objetos (POO) Estricta
- **Clases en todas las capas**: Controladores, Servicios, Repositorios, Modelos, Middlewares, Clases de Error y Configuraciones están implementadas como clases tipadas.
- **Encapsulación y Ocultamiento de Información**: Los atributos internos y llamadas a librerías de terceros (Bcrypt, JWT, Sequelize) se encuentran encapsulados en servicios dedicados (`PasswordHasher`, `TokenService`, `DatabaseConnection`).
- **Herencia y Polimorfismo**: Jerarquía de excepciones (`AppError` como clase abstracta base, de la cual derivan `BadRequestError`, `UnauthorizedError`, `NotFoundError`, etc.).

### 2. Principios SOLID Aplicados
- **S (Single Responsibility Principle)**:
  - *Models*: Persistencia y constraints en PostgreSQL.
  - *Repositories*: Consultas y agregaciones de datos con Sequelize.
  - *Services*: Reglas de negocio y flujos de dominio.
  - *Controllers*: Captura HTTP, delegación y armado de respuestas estandarizadas.
  - *Routers*: Definición de rutas y vinculación de middlewares.
- **O (Open/Closed Principle)**: Clases base extensibles sin modificar código existente.
- **L (Liskov Substitution Principle)**: Todas las excepciones pueden ser tratadas de forma uniforme por `ErrorHandlerMiddleware` gracias al polimorfismo de `AppError`.
- **I (Interface Segregation Principle)**: Interfaces segregadas y concisas (`IUserRepository`, `IProfessionalRepository`, `IReviewRepository`, `IServiceRequestRepository`).
- **D (Dependency Inversion Principle)**: Servicios dependen de abstracciones de repositorio inyectadas a través del constructor.

---

## 📂 Estructura de Carpetas Modular (MVC)

```text
backend/
├── src/
│   ├── config/  # Variables de entorno y configuración de Swagger
│   │   ├── EnvConfig.ts
│   │   └── SwaggerConfig.ts
│   ├── database/                      # Conexión Singleton Sequelize, relaciones y Seeders
│   │   ├── DatabaseConnection.ts
│   │   ├── ModelRegistry.ts
│   │   └── DatabaseSeeder.ts
│   ├── common/                        # Recursos compartidos transversales
│   │   ├── errors/                    # Jerarquía de errores POO (AppError, NotFoundError, etc.)
│   │   ├── interfaces/                # Interfaces genéricas (IBaseRepository, IApiResponse)
│   │   ├── middlewares/               # AuthMiddleware, ValidationMiddleware, ErrorHandler
│   │   └── utils/                     # ApiResponseHelper, PasswordHasher, TokenService
│   ├── modules/                       # Módulos de dominio desacoplados
│   │   ├── auth/                      # Registro, Login y Recuperación de Contraseña
│   │   ├── users/                     # Perfil y gestión de usuarios
│   │   ├── professionals/             # Búsqueda, filtros por oficio/zona y perfil Pro
│   │   ├── reviews/                   # Calificaciones, reseñas y respuestas del profesional
│   │   └── service-requests/          # Solicitudes de servicio, urgencias y presupuestos
│   ├── __tests__/                     # Suite de tests (Vitest + node:test)
│   │   ├── unit/                      # Tests unitarios por capa
│   │   ├── integration/               # Tests de integración (Supertest, Sequelize mockeado)
│   │   ├── fixtures/                  # Datos de prueba reutilizables
│   │   └── creational-patterns.test.ts # Tests legacy de patrones (node:test)
│   ├── app.ts                         # Clase App de Express
│   └── server.ts                      # Clase Server y punto de entrada
├── docs/                              # Documentación técnica por módulo
│   ├── decisiones-diseno/             # Diagramas, ADRs y documentación de diseño
│   ├── users/                         # Documentación del módulo Usuarios
│   ├── reviews/                       # (futuro) Documentación del módulo Reseñas
│   └── professionals/                 # (futuro) Documentación del módulo Profesionales
├── Dockerfile                         # Multi-stage build optimizado
├── compose.yml                        # Orquestación de Postgres y Backend
├── package.json
└── tsconfig.json
````
---

## 🗄️ Modelo de Datos y Entidades

1. **`User` (users)**:
   - Identidad, roles (`CLIENT`, `PROFESSIONAL`, `ADMIN`), credenciales con hash, y pregunta/respuesta secreta para recuperación de clave.
2. **`ProfessionalProfile` (professional_profiles)**:
   - Oficio (`tradeCategory`: plomería, electricidad, gas, etc.), matrícula, años de experiencia, zona, radio de cobertura (km), tarifario base, bandera de urgencias hoy, verificado, promedio y conteo de valoraciones por estrellas.
3. **`Review` (reviews)**:
   - Calificación (1 a 5), tipo de servicio realizado, comentario, badge de servicio verificado, y respuesta oficial del profesional.
4. **`ServiceRequest` (service_requests)**:
   - Orden de trabajo o cotización enviada por un cliente a un profesional con estado (`PENDING`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), urgencia y presupuesto estimado.

---
## 🧪 Tests

El proyecto usa **Vitest** para unitarios e integración, y **node:test** para los tests legacy de patrones creacionales.

### Cobertura por módulo

| Módulo | Unitarios | Integración | Total | Runner |
| :--- | :---: | :---: | :---: | :--- |
| **Usuarios** | 9 | 19 | **28** | Vitest |
| **Reseñas** | 6 | 2 | **8** | Vitest |
| **Profesionales** | 20 | 6 | **26** | Vitest |
| **Patrones creacionales** | 12 | — | **12** | node:test (legacy) |
| **Total** | **35** | **27** | **74** | |

### Cómo correr los tests

```bash
# Todos los tests de Vitest (unit + integración)
pnpm test

# Solo unitarios
pnpm test:unit

# Solo integración
pnpm test:integration

# Modo watch (desarrollo)
pnpm test:watch

# Tests legacy de patrones creacionales (node:test)
pnpm test:legacy

# Un archivo específico
pnpm exec vitest run src/__tests__/unit/UserService.unit.test.ts
```
---
## 📚 Documentación de Módulos

Cada módulo de dominio tiene su propia documentación técnica detallada (arquitectura, contrato de repositorio, reglas de negocio, endpoints y tests).

| Módulo | Documentación | Tests |
| :--- | :--- | :---: |
| **Usuarios** | [`docs/users/README.md`](docs/users/README.md) | 28 |
| **Reseñas** | _Pendiente_ (`docs/reviews/README.md`) | 8 |
| **Profesionales** | _Pendiente_ (`docs/professionals/README.md`) | 26 |

## 🚀 Puesta en Marcha con Docker y Docker Compose

La forma más rápida y recomendada es utilizar Docker Compose:

```bash
# Desde la raíz del repositorio o dentro de backend/
docker compose up --build
```

Esto levantará automáticamente:
1. **PostgreSQL 16**: En el puerto `5432` con volumen persistente `fixer_postgres_volume`.
2. **Fixer Backend API**: En el puerto `3000`, esperando que la base de datos esté lista para sincronizar modelos y ejecutar los seeders con los datos del maquetado (Carlos Mendoza, reseñas y clientes).

Verificación de salud:
```bash
curl http://localhost:3000/api/v1/health
```

---

## 💻 Ejecución en Desarrollo Local (sin Docker)

### Requisitos previos
- Node.js v20+ o v22+
- Servidor PostgreSQL en ejecución (por defecto `localhost:5432`, BD `fixer_db`)

### Pasos
1. Instalar dependencias:
   ```bash
   cd backend
   npm install
   ```
2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar credenciales de base de datos en .env según tu PostgreSQL local
   ```
3. Ejecutar en modo desarrollo con recarga en vivo:
   ```bash
   npm run dev
   ```
4. Compilar para producción:
   ```bash
   npm run build
   npm start
   ```

---

## 🔑 Usuarios de Prueba Precargados (Database Seeder)

| Rol | Nombre | Correo | Contraseña | Detalle / Pregunta Secreta |
| :--- | :--- | :--- | :--- | :--- |
| **Profesional** | Carlos Mendoza | `carlos.mendoza@fixerservices.com` | `Password123!` | Matrícula 48.912, Plomería & Gas. Pregunta: *¿Cuál fue el nombre de tu primer taller o maestro de oficio?* Respuesta: *Taller Don Anselmo* |
| **Profesional** | Roberto Gómez | `roberto.gomez@fixerservices.com` | `Password123!` | Electricista Matriculado COPIME |
| **Profesional** | Mariana Vázquez | `mariana.vazquez@fixerservices.com` | `Password123!` | Pintura & Acabados |
| **Cliente** | Javier Rossi | `javier.rossi@ejemplo.com` | `Password123!` | Cliente verificado con reseña |
| **Cliente** | Martina Gómez | `martina@ejemplo.com` | `Password123!` | Cliente de prueba para nuevas contrataciones |

---
## 📖 Documentación interactiva de la API (Swagger)

La API cuenta con documentación interactiva bajo el estándar OpenAPI 3.0,
implementada mediante `swagger-jsdoc` y `swagger-ui-express`.

Una vez iniciado el backend, tanto de forma local como mediante Docker,
la documentación está disponible en:

http://localhost:3000/api-docs

### Funcionalidades

- Documentación de los 18 endpoints de la API.
- Visualización de parámetros y cuerpos de las peticiones.
- Códigos de respuesta HTTP.
- Ejecución de peticiones desde el navegador mediante Try it out.
- Autenticación JWT para endpoints protegidos.

### Autenticación desde Swagger

1. Ejecutar `POST /auth/login` con las credenciales de un usuario registrado.
2. Copiar el token JWT retornado en `data.token`.
3. Presionar el botón **Authorize**.
4. Pegar el token sin el prefijo `Bearer`.
5. Ejecutar los endpoints protegidos.

### Mantenimiento

La configuración centralizada se encuentra en `src/config/SwaggerConfig.ts`.
La documentación de los endpoints se define mediante anotaciones JSDoc
en los routers de cada módulo, a excepción del endpoint Health,
documentado en `app.ts`.

Al agregar o modificar un endpoint, se debe actualizar su documentación
correspondiente.

---

## 📡 Catálogo de Endpoints RESTful

### 1. Autenticación y Recuperación (`/api/v1/auth`)
- `POST /register`: Registro de cliente o profesional (recibe `fullName`, `email`, `phone`, `password`, `securityQuestion`, `securityAnswer`, `isPro`, `tradeCategory`).
- `POST /login`: Inicio de sesión (retorna token JWT y datos de usuario).
- `POST /verify-account`: Flujo de recuperación de contraseña (valida si existe el correo y retorna la pregunta secreta configurada).
- `POST /reset-password`: Valida la respuesta secreta y actualiza la contraseña por una nueva.

### 2. Profesionales y Búsqueda (`/api/v1/professionals`)
- `GET /`: Búsqueda de profesionales con filtros query:
  - `query`: Texto libre (nombre, oficio, especialidad).
  - `category`: `plomeria`, `electricidad`, `gas`, `climatizacion`, `pintura`, etc.
  - `zone`: `palermo`, `belgrano`, `caballito`, `zona-norte`, etc.
  - `isVerified`: `true` (Solo matriculados/verificados).
  - `isEmergencyAvailable`: `true` (Disponibilidad hoy).
  - `minRating`: `4.8` (Mejor calificados).
  - `sortBy`: `rating`, `price-low`, `price-high`, `urgency`, `experience`.
  - `page` & `limit`: Paginación.
- `GET /:id`: Detalle completo del perfil profesional (ej. Carlos Mendoza), incluyendo especialidades, estadísticas y todas sus reseñas.
- `GET /me`: Obtiene el perfil del profesional autenticado.
- `PUT /me`: Actualiza información del perfil técnico, tarifas y cobertura.

### 3. Reseñas y Calificaciones (`/api/v1/reviews`)
- `GET /professional/:professionalId`: Listado de reseñas de un profesional.
- `POST /`: Publicar una reseña (requiere token de cliente). Recalcula automáticamente el rating promedio y el desglose de estrellas del profesional.
- `PATCH /:id/reply`: Responder a una reseña (solo permitido al profesional dueño del perfil).

### 4. Solicitudes de Servicio (`/api/v1/service-requests`)
- `POST /`: Crear una solicitud de servicio o pedido de urgencia a un profesional.
- `GET /client/my-requests`: Consultar órdenes solicitadas por el cliente actual.
- `GET /pro/my-requests`: Consultar órdenes asignadas al profesional actual.
- `PATCH /:id/status`: Cambiar estado (`PENDING`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).

### 5. Usuarios (`/api/v1/users`)
📖 Documentación completa: docs/users/README.md
- `GET /me`: Datos del perfil del usuario logueado.
- `PATCH /me`: Modificar nombre, teléfono o avatar.
