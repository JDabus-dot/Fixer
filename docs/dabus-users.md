# 👤 Módulo de Usuarios - Documentación Técnica

Documentación técnica del módulo **Usuarios** del backend de **Fixer Trades Marketplace**: responsabilidades, arquitectura, modelo de datos, endpoints, reglas de negocio, estrategia de tests y limitaciones conocidas.

---

## 🎯 Responsabilidad

El módulo `users` gestiona:

- La **persistencia** del usuario (tabla `users`).
- La **consulta y actualización** del perfil del usuario autenticado.
- La **exclusión de datos sensibles** (`passwordHash`, `securityAnswerHash`) en las lecturas.

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

---

## 🧪 Tests

### Ubicación

```text
src/__tests__/
├── unit/
│   ├── UserService.unit.test.ts            (3 tests)
│   └── UserController.unit.test.ts         (2 tests)
└── integration/
    ├── UserRepository.integration.test.ts  (4 tests)
    └── UserRoutes.integration.test.ts      (5 tests)
```

**Total: 14 tests.**

### Cómo correrlos

```bash
# Todos los tests del módulo
pnpm exec vitest run src/__tests__/unit/UserService.unit.test.ts \
                     src/__tests__/unit/UserController.unit.test.ts \
                     src/__tests__/integration/UserRepository.integration.test.ts \
                     src/__tests__/integration/UserRoutes.integration.test.ts

# Solo los unitarios del módulo
pnpm exec vitest run src/__tests__/unit/UserService.unit.test.ts \
                     src/__tests__/unit/UserController.unit.test.ts
```

### Cobertura por caso (críticos)

**`UserService`**
- `getProfile`: éxito / `NotFoundError`.
- `updateProfile`: lanza `NotFoundError` y no llama a `update` si no existe.

**`UserController`**
- `getMyProfile`: éxito / `UnauthorizedError`.

**`UserRepository`**
- `findById`: exclusión de hashes.
- `findByEmail`: normalización.
- `findByEmailWithPassword`: no excluye hashes.
- `existsByEmail`: `true` / `false`.

**`UserRoutes`**
- `GET /me`: `401` sin token / `401` token inválido / `200` éxito.
- `PATCH /me`: `422` body inválido / `200` éxito.

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
