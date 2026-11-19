# ðŸ”¨ Fixer Trades Marketplace - Backend API

Backend RESTful para la plataforma **Fixer Trades Marketplace**, construido con **Node.js, TypeScript, Express, PostgreSQL y Sequelize** bajo **POO, SOLID, Clean Code y MVC Modular**.

---

## ðŸ“‚ Estructura de Carpetas Modular (MVC)

```text
backend/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ config/                        # Variables de entorno y configuraciÃ³n de Swagger
â”‚   â”‚   â”œâ”€â”€ EnvConfig.ts
â”‚   â”‚   â””â”€â”€ SwaggerConfig.ts
â”‚   â”œâ”€â”€ database/                      # ConexiÃ³n Singleton Sequelize, relaciones y Seeders
â”‚   â”‚   â”œâ”€â”€ DatabaseConnection.ts
â”‚   â”‚   â”œâ”€â”€ ModelRegistry.ts
â”‚   â”‚   â””â”€â”€ DatabaseSeeder.ts
â”‚   â”œâ”€â”€ common/                        # Recursos compartidos transversales
â”‚   â”‚   â”œâ”€â”€ errors/                    # JerarquÃ­a de errores POO (AppError, NotFoundError, etc.)
â”‚   â”‚   â”œâ”€â”€ interfaces/                # Interfaces genÃ©ricas (IBaseRepository, IApiResponse)
â”‚   â”‚   â”œâ”€â”€ middlewares/               # AuthMiddleware, ValidationMiddleware, ErrorHandler
â”‚   â”‚   â””â”€â”€ utils/                     # ApiResponseHelper, PasswordHasher, TokenService
â”‚   â”œâ”€â”€ modules/                       # MÃ³dulos de dominio desacoplados
â”‚   â”‚   â”œâ”€â”€ auth/                      # Registro, Login y RecuperaciÃ³n de ContraseÃ±a
â”‚   â”‚   â”œâ”€â”€ users/                     # Perfil y gestiÃ³n de usuarios
â”‚   â”‚   â”œâ”€â”€ professionals/             # BÃºsqueda, filtros por oficio/zona y perfil Pro
â”‚   â”‚   â”œâ”€â”€ reviews/                   # Calificaciones, reseÃ±as y respuestas del profesional
â”‚   â”‚   â””â”€â”€ service-requests/          # Solicitudes de servicio, urgencias y presupuestos
â”‚   â”œâ”€â”€ __tests__/                     # Suite de tests (Vitest)
â”‚   â”‚   â”œâ”€â”€ unit/                      # Tests unitarios por capa
â”‚   â”‚   â”œâ”€â”€ integration/               # Tests de integraciÃ³n (Supertest, Sequelize mockeado)
â”‚   â”‚   â””â”€â”€ fixtures/                  # Datos de prueba reutilizables
â”‚   â”œâ”€â”€ app.ts                         # Clase App de Express
â”‚   â””â”€â”€ server.ts                      # Clase Server y punto de entrada
â”œâ”€â”€ docs/                              # DocumentaciÃ³n tÃ©cnica por mÃ³dulo
â”‚   â”œâ”€â”€ decisiones-diseno/             # Diagramas, ADRs y documentaciÃ³n de diseÃ±o
â”‚   â”œâ”€â”€ users/                         # DocumentaciÃ³n del mÃ³dulo Usuarios
â”‚   â”œâ”€â”€ auth/                          # DocumentaciÃ³n del mÃ³dulo Auth
â”‚   â”œâ”€â”€ reviews/                       # (futuro) DocumentaciÃ³n del mÃ³dulo ReseÃ±as
â”‚   â”œâ”€â”€ professionals/                 # (futuro) DocumentaciÃ³n del mÃ³dulo Profesionales
â”‚   â””â”€â”€ service-requests/              # (futuro) DocumentaciÃ³n del mÃ³dulo Service Requests
â”œâ”€â”€ Dockerfile                         # Multi-stage build optimizado
â”œâ”€â”€ compose.yml                        # OrquestaciÃ³n de Postgres y Backend
â”œâ”€â”€ package.json
â””â”€â”€ tsconfig.json

```
---

## ðŸ—„ï¸ Entidades

| Entidad | Tabla | PropÃ³sito |
| :--- | :--- | :--- |
| `User` | `users` | Identidad, roles (`CLIENT`, `PROFESSIONAL`, `ADMIN`), credenciales con hash, pregunta secreta. |
| `ProfessionalProfile` | `professional_profiles` | Oficio, matrÃ­cula, zona, cobertura, tarifas, rating promedio y desglose de estrellas. |
| `Review` | `reviews` | CalificaciÃ³n 1â€“5, comentario, badge verificado, respuesta del profesional. |
| `ServiceRequest` | `service_requests` | Orden de trabajo con estado (`PENDING` â†’ `COMPLETED`), urgencia y presupuesto. |
|`Auth`| `auth`|  Gestiona registro, login con JWT y recuperaciÃ³n de contraseÃ±a mediante pregunta/respuesta secreta.

---
## ðŸ“š DocumentaciÃ³n de MÃ³dulos

Cada mÃ³dulo de dominio tiene su propia documentaciÃ³n tÃ©cnica detallada (arquitectura, contrato de repositorio, reglas de negocio, endpoints y tests).

| MÃ³dulo | DocumentaciÃ³n | Tests |
| :--- | :--- | :---: |
| Usuarios | [`docs/dabus-users.md`](docs/dabus-users.md) | 14 |
| Auth | [`docs/dabus-auth.md`](docs/dabus-auth.md) | 11 |
| ReseÃ±as | Pendiente (`docs/reviews/README.md`) | 8 |
| Profesionales | [`docs/baldres-professional.md`](docs/baldres-professional.md) | 26 |
| Service Requests | [`docs/baldres-service-request.md`](docs/baldres-service-request.md) | 10 |

---

## ðŸ§ª Tests

El proyecto usa **Vitest** para unitarios e integraciÃ³n.

### Cobertura por mÃ³dulo

| MÃ³dulo | Unitarios | IntegraciÃ³n | Total | Runner |
| :--- | :---: | :---: | :---: | :--- |
| **Usuarios** | 5 | 9 | **14** | Vitest |
| **Auth** | 8 | 3 | **11** | Vitest |
| **ReseÃ±as** | 6 | 2 | **8** | Vitest |
| **Profesionales** | 20 | 6 | **26** | Vitest |
| **Service Requests** | 7 | 3 | **10** | Vitest |
| **Total** | **46** | **23** | **69** | |

> â„¹ï¸ **Nota:** la suite de tests se enfoca en los **caminos crÃ­ticos** (seguridad, validaciÃ³n de entrada, errores de negocio y flujos HTTP principales) para garantizar la calidad sin sobredimensionar el mantenimiento.

### CÃ³mo correr los tests

```bash
# Todos los tests (unit + integraciÃ³n)
pnpm test

# Solo unitarios
pnpm test:unit

# Solo integraciÃ³n
pnpm test:integration

# Modo watch (desarrollo)
pnpm test:watch

# Un archivo especÃ­fico
pnpm exec vitest run src/__tests__/unit/AuthService.unit.test.ts
```

---

## ðŸš€ Puesta en Marcha con Docker y Docker Compose

La forma mÃ¡s rÃ¡pida y recomendada es utilizar Docker Compose:

```bash
# Desde la raÃ­z del repositorio o dentro de backend/
docker compose up --build
```

Esto levantarÃ¡ automÃ¡ticamente:
1. **PostgreSQL 16**: En el puerto `5432` con volumen persistente `fixer_postgres_volume`.
2. **Fixer Backend API**: En el puerto `3000`, esperando que la base de datos estÃ© lista para sincronizar modelos y ejecutar los seeders con los datos del maquetado (Carlos Mendoza, reseÃ±as y clientes).

VerificaciÃ³n de salud:
```bash
curl http://localhost:3000/api/v1/health
```

---

## ðŸ’» EjecuciÃ³n en Desarrollo Local (sin Docker)

### Requisitos previos
- Node.js v20+ o v22+
- Servidor PostgreSQL en ejecuciÃ³n (por defecto `localhost:5432`, BD `fixer_db`)

### Pasos
1. Instalar dependencias:
   ```bash
   cd backend
   npm install
   ```
2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar credenciales de base de datos en .env segÃºn tu PostgreSQL local
   ```
3. Ejecutar en modo desarrollo con recarga en vivo:
   ```bash
   npm run dev
   ```
4. Compilar para producciÃ³n:
   ```bash
   npm run build
   npm start
   ```

---

## ðŸ”‘ Usuarios de Prueba Precargados (Database Seeder)

| Rol | Nombre | Correo | ContraseÃ±a | Detalle / Pregunta Secreta |
| :--- | :--- | :--- | :--- | :--- |
| **Profesional** | Carlos Mendoza | `carlos.mendoza@fixerservices.com` | `Password123!` | MatrÃ­cula 48.912, PlomerÃ­a & Gas. Pregunta: *Â¿CuÃ¡l fue el nombre de tu primer taller o maestro de oficio?* Respuesta: *Taller Don Anselmo* |
| **Profesional** | Roberto GÃ³mez | `roberto.gomez@fixerservices.com` | `Password123!` | Electricista Matriculado COPIME |
| **Profesional** | Mariana VÃ¡zquez | `mariana.vazquez@fixerservices.com` | `Password123!` | Pintura & Acabados |
| **Cliente** | Javier Rossi | `javier.rossi@ejemplo.com` | `Password123!` | Cliente verificado con reseÃ±a |
| **Cliente** | Martina GÃ³mez | `martina@ejemplo.com` | `Password123!` | Cliente de prueba para nuevas contrataciones |

---
## ðŸ“– DocumentaciÃ³n interactiva de la API (Swagger)

La API cuenta con documentaciÃ³n interactiva bajo el estÃ¡ndar OpenAPI 3.0,
implementada mediante `swagger-jsdoc` y `swagger-ui-express`.

Una vez iniciado el backend, tanto de forma local como mediante Docker,
la documentaciÃ³n estÃ¡ disponible en:

http://localhost:3000/api-docs

### Funcionalidades

- DocumentaciÃ³n de los 18 endpoints de la API.
- VisualizaciÃ³n de parÃ¡metros y cuerpos de las peticiones.
- CÃ³digos de respuesta HTTP.
- EjecuciÃ³n de peticiones desde el navegador mediante Try it out.
- AutenticaciÃ³n JWT para endpoints protegidos.

### AutenticaciÃ³n desde Swagger

1. Ejecutar `POST /auth/login` con las credenciales de un usuario registrado.
2. Copiar el token JWT retornado en `data.token`.
3. Presionar el botÃ³n **Authorize**.
4. Pegar el token sin el prefijo `Bearer`.
5. Ejecutar los endpoints protegidos.

### Mantenimiento

La configuraciÃ³n centralizada se encuentra en `src/config/SwaggerConfig.ts`.
La documentaciÃ³n de los endpoints se define mediante anotaciones JSDoc
en los routers de cada mÃ³dulo, a excepciÃ³n del endpoint Health,
documentado en `app.ts`.

Al agregar o modificar un endpoint, se debe actualizar su documentaciÃ³n
correspondiente.

---
