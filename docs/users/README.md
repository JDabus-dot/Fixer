# 👤 Módulo de Usuarios - Documentación Técnica

Documentación técnica del módulo **Usuarios** del backend de **Fixer Trades Marketplace**: responsabilidades, arquitectura, modelo de datos, endpoints, reglas de negocio, estrategia de tests y limitaciones conocidas.

---

## 🎯 Responsabilidad

El módulo `users` gestiona:

- La **persistencia** del usuario (tabla `users`).
- La **consulta y actualización** del perfil del usuario autenticado.
- La **exclusión de datos sensibles** (`passwordHash`, `securityAnswerHash`) en las lecturas.

> No gestiona autenticación (login/registro/recuperación de contraseña) ni perfiles profesionales. Eso vive en los módulos `auth` y `professionals` respectivamente. Nota: `AuthService` reutiliza `UserRepository` (`existsByEmail`, `findByEmail`, `findByEmailWithPassword`), por lo que un cambio en el repositorio de Usuarios impacta también en Auth.

---

## 🏛️ Arquitectura y Capas

El módulo sigue **MVC modular + SOLID + POO** con inyección de dependencias por constructor.

```text
┌─────────────────────────────────────────────────────────────┐
│ HTTP (Express)                                              │
│   GET   /api/v1/users/me                                    │
│   PATCH /api/v1/users/me                                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ UserRouter → AuthMiddleware + ValidationMiddleware          │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ UserController (orquesta req/res, chequea req.user)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ UserService (reglas de negocio, NotFoundError)              │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ IUserRepository (contrato) ← UserRepository (Sequelize)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ UserModel (Sequelize) → tabla users                         │
└─────────────────────────────────────────────────────────────┘
```

### Dependencias entre capas

| Capa | Depende de | Se inyecta en |
| :--- | :--- | :--- |
| `UserRouter` | `UserController`, `AuthMiddleware` | constructor |
| `UserController` | `UserService` | constructor |
| `UserService` | `IUserRepository` | constructor |
| `UserRepository` | `UserModel`, `ProfessionalProfileModel` | imports directos |
| `UserModel` | `Sequelize` | `initialize(sequelize)` |

> La inversión de dependencias (**DIP**) se aplica en `UserService`: depende de la **interfaz** `IUserRepository`, no de la implementación concreta.

---

## 🗄️ Modelo de Datos: `users`

Definido en `src/modules/users/models/UserModel.ts`. En PostgreSQL las columnas se crean en `snake_case` (`full_name`, `password_hash`, etc.) porque `DatabaseConnection` configura `underscored: true`.

| Campo | Tipo | Nulo | Default | Notas |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | No | `UUIDV4` | Clave primaria |
| `fullName` | STRING(120) | No | — | |
| `email` | STRING(150) | No | — | **Único**, validado con `isEmail` |
| `phone` | STRING(40) | No | — | |
| `passwordHash` | STRING(255) | No | — | **Nunca debe exponerse** |
| `role` | ENUM | No | `'CLIENT'` | `CLIENT` \| `PROFESSIONAL` \| `ADMIN` |
| `securityQuestion` | STRING(255) | No | — | |
| `securityAnswerHash` | STRING(255) | No | — | **Nunca debe exponerse** |
| `avatarUrl` | STRING(500) | Sí | `null` | |
| `termsAccepted` | BOOLEAN | No | `true` | |
| `isActive` | BOOLEAN | No | `true` | |
| `createdAt` | Date | — | auto | |
| `updatedAt` | Date | — | auto | |

### Índices

- `UNIQUE (email)`: evita duplicados y acelera login/registro.
- `INDEX (role)`: acelera filtros por rol.

### Asociaciones

- `UserModel` **tiene un** `ProfessionalProfileModel` (alias `professionalProfile`, relación 1 a 1 por `userId`).
  - Se incluye en `findById`, `findByEmail` y `findByEmailWithPassword` para traer el perfil profesional en la misma consulta.
- `UserModel` **tiene muchas** reseñas escritas (`reviewsWritten`) y solicitudes de servicio (`serviceRequests`).

---

## 📜 Contrato del Repositorio: `IUserRepository`

Hereda de `IBaseRepository<UserModel, string>` y agrega métodos específicos:

```typescript
interface IUserRepository extends IBaseRepository<UserModel, string> {
  findByEmail(email: string): Promise<UserModel | null>;
  findByEmailWithPassword(email: string): Promise<UserModel | null>;
  existsByEmail(email: string): Promise<boolean>;
}
```

---

## 📡 Endpoints

Base: `/api/v1/users`

### 1. `GET /me`

Devuelve el perfil del usuario autenticado.

- **Auth**: requerida (`Authorization: Bearer <JWT>`).
- **Body**: —

**Respuesta `200`** (ejemplo para un `CLIENT`):

```json
{
  "success": true,
  "message": "Perfil obtenido correctamente",
  "data": {
    "id": "dc2667c0-dcd1-4e5c-a95b-54e7b9a4fd51",
    "fullName": "Javier Rossi",
    "email": "javier.rossi@ejemplo.com",
    "phone": "+54 9 11 2233-4455",
    "role": "CLIENT",
    "securityQuestion": "mascota",
    "avatarUrl": null,
    "termsAccepted": true,
    "isActive": true,
    "createdAt": "2026-11-18T13:16:35.959Z",
    "updatedAt": "2026-11-18T13:16:35.959Z",
    "professionalProfile": null
  }
}
```

> Para un usuario con rol `PROFESSIONAL`, `professionalProfile` es un objeto con el perfil técnico (oficio, matrícula, zona, calificaciones, etc.) en lugar de `null`.

**Errores:**

| Código | Causa |
| :---: | :--- |
| `401` | Sin token, esquema distinto de `Bearer`, o token inválido/expirado |
| `404` | El usuario del token ya no existe |

### 2. `PATCH /me`

Actualiza el perfil del usuario autenticado.

- **Auth**: requerida.
- **Body** (validado con Zod, `UpdateUserSchema`). Todos los campos son opcionales:

```jsonc
{
  "fullName": "Juan Martínez Actualizado",   // mínimo 2 caracteres
  "phone": "+5491199999999",                 // mínimo 6 caracteres
  "avatarUrl": "https://cdn.fixer.com/a.png" // URL válida, o null para quitar el avatar
}
```

Cualquier otro campo enviado (`role`, `email`, `isActive`, `passwordHash`, etc.) es **descartado silenciosamente** por el esquema: no se puede escalar privilegios ni modificar datos sensibles desde este endpoint.

**Respuesta `200`:**

```json
{
  "success": true,
  "message": "Perfil actualizado correctamente",
  "data": { "...": "usuario actualizado" }
}
```

> ⚠️ **Problema conocido (seguridad):** hoy la respuesta de `PATCH /me` incluye `passwordHash` y `securityAnswerHash`. Ver [Problemas Conocidos](#-problemas-conocidos).

**Errores:**

| Código | Causa |
| :---: | :--- |
| `401` | Sin token o token inválido/expirado |
| `404` | El usuario del token ya no existe |
| `422` | El body no cumple el esquema Zod (ej. `fullName: "A"`). El detalle viene en `error.details` como lista de `{ field, message }` |
| `500` | `fullName` > 120 o `phone` > 40 caracteres (superan el límite de la columna). Ver [Problemas Conocidos](#-problemas-conocidos) |

Ejemplo de respuesta `422`:

```json
{
  "success": false,
  "message": "Datos de entrada inválidos en el cuerpo de la petición",
  "error": {
    "details": [
      { "field": "fullName", "message": "El nombre debe tener al menos 2 caracteres" }
    ]
  }
}
```

---

## 📏 Reglas de Negocio

1. **No exponer hashes**: `passwordHash` y `securityAnswerHash` se excluyen en `findById`, `findAll` y `findByEmail`. La única excepción intencional es `findByEmailWithPassword` (uso interno de login y reset de contraseña). *(Excepción no intencional: `update`, ver Problemas Conocidos.)*
2. **Normalización de email**: se compara siempre en minúsculas y sin espacios (`email.toLowerCase().trim()`).
3. **Usuario inexistente → 404**: `UserService` lanza `NotFoundError` cuando `findById` devuelve `null`.
4. **No actualizar usuarios inexistentes**: `updateProfile` verifica la existencia antes de llamar a `update`; si no existe, lanza `NotFoundError` y no toca la base de datos.
5. **Defensa en profundidad**: `UserController` valida `req.user` y lanza `UnauthorizedError` aunque `AuthMiddleware` ya lo haya validado.
6. **Validación de entrada**: `ValidationMiddleware` con Zod rechaza bodies inválidos antes de llegar al controller (responde `422`).
7. **Campos no editables**: desde `PATCH /me` solo se pueden modificar `fullName`, `phone` y `avatarUrl`.

---

## 🧪 Tests

### Ubicación

```text
src/__tests__/
├── unit/
│   ├── UserService.unit.test.ts            (5 tests)
│   └── UserController.unit.test.ts         (4 tests)
└── integration/
    ├── UserRepository.integration.test.ts  (13 tests)
    └── UserRoutes.integration.test.ts      (6 tests)
```

**Total: 28 tests.**

### Estrategia

| Archivo | Capa | Mockea | Verifica |
| :--- | :--- | :--- | :--- |
| `UserService.unit.test.ts` | Servicio | `IUserRepository` | Lógica de negocio: éxito y `NotFoundError`; paso del DTO sin transformar |
| `UserController.unit.test.ts` | Controller | `UserService` + `req`/`res` | `UnauthorizedError` sin `req.user`; formato exacto de respuesta |
| `UserRepository.integration.test.ts` | Repositorio | `UserModel`, `ProfessionalProfileModel` | Armado de queries: exclusión de hashes, normalización de email, find + update, delete |
| `UserRoutes.integration.test.ts` | HTTP | `UserRepository` (inyectado en `App`) | Flujo completo: 401 sin/inválido token, 422 body inválido, 200 caminos felices |

### Cómo correrlos

```bash
# Todos los tests del módulo
pnpm exec vitest run src/__tests__/unit/UserService.unit.test.ts \
                     src/__tests__/unit/UserController.unit.test.ts \
                     src/__tests__/integration/UserRepository.integration.test.ts \
                     src/__tests__/integration/UserRoutes.integration.test.ts

# Solo unitarios
pnpm test:unit

# Solo integración
pnpm test:integration
```

### Cobertura por caso

**`UserService`**
- `getProfile`: éxito / `NotFoundError`.
- `updateProfile`: éxito / `NotFoundError` / paso del DTO / no-update si no existe.

**`UserController`**
- `getMyProfile`: éxito / `UnauthorizedError`.
- `updateMyProfile`: éxito / `UnauthorizedError`.

**`UserRepository`**
- `findById`: exclusión de hashes + include / `null`.
- `findAll`: exclusión de hashes / filtros.
- `findByEmail`: normalización.
- `findByEmailWithPassword`: no excluye hashes.
- `existsByEmail`: `true` / `false`.
- `create`: pasamanos del payload.
- `update`: find + update / `null` si no existe.
- `delete`: `true` / `false`.

**`UserRoutes`**
- `GET /me`: 401 sin token / 401 token inválido / 200 éxito.
- `PATCH /me`: 401 sin token / 422 body inválido / 200 éxito.

---

## 📂 Archivos del Módulo

```text
src/modules/users/
├── controllers/
│   └── UserController.ts
├── dtos/
│   └── UserDTOs.ts              # UpdateUserSchema + UpdateUserDTO (Zod)
├── interfaces/
│   └── IUserRepository.ts
├── models/
│   └── UserModel.ts
├── repositories/
│   └── UserRepository.ts
├── routes/
│   └── UserRouter.ts
└── services/
    └── UserService.ts
```

---

## 🔗 Referencias

- `src/app.ts`: composición e inyección de dependencias.
- `src/common/middlewares/AuthMiddleware.ts`: autenticación JWT.
- `src/common/middlewares/ValidationMiddleware.ts`: validación Zod (`422`).
- `src/common/middlewares/ErrorHandlerMiddleware.ts`: mapeo de errores a HTTP.
- `src/common/utils/ApiResponseHelper.ts`: formato estándar de respuesta.
- `src/common/utils/TokenService.ts`: emisión/verificación de JWT.
- `docs/decisiones-diseno.md`: decisiones de diseño del backend (Factory y Builder).