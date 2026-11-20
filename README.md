# 🔨 Fixer Trades Marketplace - Backend API

Backend RESTful para la plataforma **Fixer Trades Marketplace**, construido con **Node.js, TypeScript, Express, PostgreSQL y Sequelize** bajo **POO, SOLID, Clean Code y MVC Modular**.

---

## 📂 Estructura de Carpetas Modular (MVC)

```text

├── src/
│   ├── config/                        # Variables de entorno y configuración de Swagger
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
│   ├── __tests__/                     # Suite de tests (Vitest)
|   |   ├── e2e/                       # Test e2e
│   │   ├── unit/                      # Tests unitarios por capa
│   │   ├── integration/               # Tests de integración (Supertest, Sequelize mockeado)
│   │   └── fixtures/                  # Datos de prueba reutilizables
│   ├── app.ts                         # Clase App de Express
│   └── server.ts                      # Clase Server y punto de entrada
├── docs/                              # Documentación técnica por módulo
│   ├── decisiones-diseno.md           # Decisiones de diseño (Factory Method y Builder)
│   ├── dabus-users.md                 # Documentación del módulo Usuarios
│   ├── dabus-auth.md                  # Documentación del módulo Auth
│   ├── belardinelli-reviews.md        # Documentación del módulo Reseñas
│   ├── baldres-professional.md        # Documentación del módulo Profesionales
│   └── baldres-service-request.md     # Documentación del módulo Service Requests
├── Dockerfile                         # Multi-stage build optimizado
├── compose.yml                        # Orquestación de Postgres y Backend
├── package.json
└── tsconfig.json
```

---

## 🗄️ Entidades

| Entidad | Tabla | Propósito |
| :--- | :--- | :--- |
| `User` | `users` | Identidad, roles (`CLIENT`, `PROFESSIONAL`, `ADMIN`), credenciales con hash, pregunta secreta. |
| `ProfessionalProfile` | `professional_profiles` | Oficio, matrícula, zona, cobertura, tarifas, rating promedio y desglose de estrellas. |
| `Review` | `reviews` | Calificación 1–5, comentario, badge verificado, respuesta del profesional. |
| `ServiceRequest` | `service_requests` | Orden de trabajo con estado (`PENDING` → `COMPLETED`), urgencia y presupuesto. |

> El módulo **Auth** (registro, login con JWT y recuperación de contraseña mediante pregunta/respuesta secreta) no tiene tabla propia: opera sobre `users` y `professional_profiles`.

---

## 📚 Documentación de Módulos

Cada módulo de dominio tiene su propia documentación técnica detallada (arquitectura, contrato de repositorio, reglas de negocio, endpoints y tests).

| Módulo | Documentación | Tests |
| :--- | :--- | :---: |
| Usuarios | [`docs/dabus-users.md`](docs/dabus-users.md) | 14 |
| Auth | [`docs/dabus-auth.md`](docs/dabus-auth.md) | 11 |
| Reseñas | [`docs/belardinelli-reviews.md`](docs/belardinelli-reviews.md) | 8 |
| Profesionales | [`docs/baldres-professional.md`](docs/baldres-professional.md) | 26 |
| Service Requests | [`docs/baldres-service-request.md`](docs/baldres-service-request.md) | 10 |
---

## 🧪 Tests

El proyecto usa **Vitest** para unitarios e integración.

### Cobertura por módulo

| Módulo | Unitarios | Integración | Total | Runner |
| :--- | :---: | :---: | :---: | :--- |
| **Usuarios** | 5 | 9 | **14** | Vitest |
| **Auth** | 8 | 3 | **11** | Vitest |
| **Reseñas** | 6 | 2 | **8** | Vitest |
| **Profesionales** | 20 | 6 | **26** | Vitest |
| **Service Requests** | 7 | 3 | **10** | Vitest |
| **Total** | **46** | **23** | **69** | |

> ℹ️ **Nota:** la suite de tests se enfoca en los **caminos críticos** (seguridad, validación de entrada, errores de negocio y flujos HTTP principales) para garantizar la calidad sin sobredimensionar el mantenimiento.

### Cómo correr los tests

```bash
# Todos los tests (unit + integración)
pnpm test

# Solo unitarios
pnpm test:unit

# Solo integración
pnpm test:integration

# Modo watch (desarrollo)
pnpm test:watch

# Un archivo específico
pnpm exec vitest run src/__tests__/unit/AuthService.unit.test.ts

# e2e 
pnpm test:e2e

# coverage
pnpm test:coverage
```


---

## 🚀 Puesta en Marcha con Docker y Docker Compose

La forma más rápida y recomendada es utilizar Docker Compose:

```bash
# Desde la raíz del repositorio/
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
   pnpm install
   ```
2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar credenciales de base de datos en .env según tu PostgreSQL local
   ```
3. Ejecutar en modo desarrollo con recarga en vivo:
   ```bash
   pnpm run dev
   ```
4. Compilar para producción:
   ```bash
   pnpm run build
   pnpm start
   ```

---

## 🔑 Usuarios de Prueba Precargados (Database Seeder)

| Rol | Nombre | Correo | Contraseña | Detalle / Pregunta Secreta |
| :--- | :--- | :--- | :--- | :--- |
| **Profesional** | Carlos Mendoza | `carlos.mendoza@fixerservices.com` | `Password123!` | Matrícula 48.912, Plomería & Gas. Pregunta: *¿Cuál fue el nombre de tu primer taller o maestro de oficio?* Respuesta: *Taller Don Anselmo* |
| **Profesional** | Roberto Gómez | `roberto.gomez@fixerservices.com` | `Password123!` | Electricista Matriculado COPIME |
| **Profesional** | Mariana Vázquez | `mariana.vazquez@fixerservices.com` | `Password123!` | Pintura & Acabados |
| **Cliente** | Javier Rossi | `javier.rossi@ejemplo.com` | `Password123!` | Cliente verificado con reseña |
| **Cliente** | Florencia Benítez | `florencia.benitez@ejemplo.com` | `Password123!` | Cliente con reseña |
| **Cliente** | Gonzalo Morales | `gonzalo.morales@ejemplo.com` | `Password123!` | Cliente con reseña |
| **Cliente** | Martina Gómez | `martina@ejemplo.com` | `Password123!` | Cliente de prueba para nuevas contrataciones |

---

## 📖 Documentación interactiva de la API (Swagger)

La API cuenta con documentación interactiva bajo el estándar OpenAPI 3.0, implementada mediante `swagger-jsdoc` y `swagger-ui-express`.

Una vez iniciado el backend, tanto de forma local como mediante Docker, la documentación está disponible en:

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
La documentación de los endpoints se define mediante anotaciones JSDoc en los routers de cada módulo, a excepción del endpoint Health, documentado en `app.ts`.

Al agregar o modificar un endpoint, se debe actualizar su documentación correspondiente.