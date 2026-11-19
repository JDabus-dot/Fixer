# 🔐 Módulo de Autenticación - Documentación Técnica

Documentación técnica del módulo **Auth** del backend de **Fixer Trades Marketplace**: responsabilidades, arquitectura, endpoints, reglas de negocio, estrategia de tests y limitaciones conocidas.

---

## 🎯 Responsabilidad

El módulo `auth` gestiona:

- **Registro** de clientes y profesionales (crea `User` y, si `isPro`, `ProfessionalProfile`).
- **Login** con emisión de JWT.
- **Recuperación de contraseña** en dos pasos: verificar cuenta (devuelve la pregunta secreta) y resetear contraseña (valida la respuesta secreta).

---

### Patrones de diseño

- **Factory Method** (`AccountFactory` + `AccountCreator`): `AuthService` no conoce las jerarquías de cuentas. Según `isPro` se resuelve `ClientAccountCreator` o `ProfessionalAccountCreator`, y se pueden registrar nuevos roles con `AccountFactory.registerCreator()` sin modificar el servicio (OCP).
- **Builder** (`ProfessionalProfileBuilder`): construye el perfil profesional inicial de forma consistente al registrar un profesional.

> Detalle y justificación de ambos patrones en [`docs/decisiones-diseno.md`](decisiones-diseno.md).

---

## 📡 Endpoints

Base: `/api/v1/auth`. Ningún endpoint de este módulo requiere autenticación.

### 1. `POST /register`

Registra un cliente o un profesional y devuelve el usuario junto con un JWT.

**Body** (`RegisterSchema`):

| Campo | Tipo | Requerido | Validación |
| :--- | :--- | :---: | :--- |
| `fullName` | string | Sí | mínimo 3 caracteres |
| `email` | string | Sí | formato de email válido |
| `phone` | string | Sí | mínimo 8 caracteres |
| `password` | string | Sí | mínimo 8 caracteres |
| `securityQuestion` | string | Sí | mínimo 3 caracteres |
| `securityAnswer` | string | Sí | mínimo 2 caracteres |
| `isPro` | boolean | No | por defecto `false`. `true` crea además el `ProfessionalProfile` |
| `tradeCategory` | string | No | oficio del profesional (solo se usa si `isPro` es `true`; por defecto `otro`) |

**Respuesta `201`:**

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "Cliente Prueba",
      "email": "cliente@example.com",
      "phone": "1122334455",
      "role": "CLIENT",
      "avatarUrl": null,
      "isPro": false
    },
    "token": "<JWT>"
  }
}
```

**Errores:**

| Código | Causa |
| :---: | :--- |
| `409` | Email ya registrado (`ConflictError`). La comparación ignora mayúsculas y espacios |
| `422` | El body no cumple el esquema Zod. El detalle viene en `error.details` como lista de `{ field, message }` |
| `500` | `fullName` > 120, `phone` > 40 o `tradeCategory` > 80 caracteres. Ver la sección *Problemas Conocidos* |

### 2. `POST /login`

Autentica con email y contraseña y devuelve el usuario junto con un JWT.

**Body** (`LoginSchema`):

| Campo | Tipo | Requerido | Validación |
| :--- | :--- | :---: | :--- |
| `email` | string | Sí | formato de email válido (no distingue mayúsculas) |
| `password` | string | Sí | no vacío |
| `rememberMe` | boolean | No | por defecto `false`. **Se acepta pero hoy no tiene efecto** |

**Respuesta `200`:**

```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "Cliente Prueba",
      "email": "cliente@example.com",
      "phone": "1122334455",
      "role": "CLIENT",
      "avatarUrl": null,
      "isPro": false
    },
    "token": "<JWT>"
  }
}
```

**Errores:**

| Código | Causa |
| :---: | :--- |
| `401` | Credenciales incorrectas o cuenta inactiva (`UnauthorizedError`) |
| `422` | El body no cumple el esquema Zod |

### 3. `POST /verify-account`

Primer paso de la recuperación de contraseña: confirma que el email existe y devuelve su pregunta secreta.

**Body** (`VerifyAccountSchema`):

| Campo | Tipo | Requerido | Validación |
| :--- | :--- | :---: | :--- |
| `email` | string | Sí | formato de email válido |

**Respuesta `200`:**

```json
{
  "success": true,
  "message": "Cuenta verificada correctamente",
  "data": {
    "email": "cliente@example.com",
    "securityQuestion": "¿Cómo se llama tu mascota?"
  }
}
```

**Errores:**

| Código | Causa |
| :---: | :--- |
| `404` | Email no registrado (`NotFoundError`) |
| `422` | El body no cumple el esquema Zod |

### 4. `POST /reset-password`

Segundo paso de la recuperación: valida la respuesta secreta y establece la nueva contraseña.

**Body** (`ResetPasswordSchema`):

| Campo | Tipo | Requerido | Validación |
| :--- | :--- | :---: | :--- |
| `email` | string | Sí | formato de email válido |
| `securityAnswer` | string | Sí | no vacío. Se compara sin distinguir mayúsculas ni espacios en los extremos |
| `newPassword` | string | Sí | mínimo 8 caracteres |

**Respuesta `200`:**

```json
{
  "success": true,
  "message": "Tu contraseña ha sido restablecida con éxito. Ya podés iniciar sesión.",
  "data": {
    "message": "Tu contraseña ha sido restablecida con éxito. Ya podés iniciar sesión."
  }
}
```

**Errores:**

| Código | Causa |
| :---: | :--- |
| `401` | Respuesta secreta incorrecta (`UnauthorizedError`) |
| `404` | Email no registrado (`NotFoundError`) |
| `422` | El body no cumple el esquema Zod |

---

## 🧪 Tests

### Ubicación

```text
src/__tests__/
├── unit/
│   ├── AuthService.unit.test.ts        (6 tests)
│   └── AuthController.unit.test.ts     (2 tests)
└── integration/
    └── AuthRoutes.integration.test.ts  (3 tests)
```

**Total: 11 tests.**

### Estrategia

| Archivo | Capa | Mockea | Verifica |
| :--- | :--- | :--- | :--- |
| `AuthService.unit.test.ts` | Servicio | `IUserRepository`, `PasswordHasher`, `TokenService`, `AccountFactory` | `ConflictError` (email duplicado), login exitoso, cuenta inactiva, password incorrecta, `NotFoundError` y respuesta secreta incorrecta. |
| `AuthController.unit.test.ts` | Controller | `AuthService` + `req`/`res` | Formato exacto de respuesta (`201`/`200`). |
| `AuthRoutes.integration.test.ts` | HTTP | `UserRepository` + `PasswordHasher` (mockeado para forzar éxito) | `422` (body inválido), `200` (login), `401` (credenciales inválidas). |

### Cómo correrlos

```bash
# Todos los tests del módulo
pnpm exec vitest run src/__tests__/unit/AuthService.unit.test.ts \
                     src/__tests__/unit/AuthController.unit.test.ts \
                     src/__tests__/integration/AuthRoutes.integration.test.ts

# Solo los unitarios del módulo
pnpm exec vitest run src/__tests__/unit/AuthService.unit.test.ts \
                     src/__tests__/unit/AuthController.unit.test.ts
```

---

## 📂 Archivos del Módulo

```text
src/modules/auth/
├── controllers/
│   └── AuthController.ts
├── dtos/
│   └── AuthDTOs.ts              # RegisterSchema, LoginSchema, VerifyAccountSchema, ResetPasswordSchema
├── factories/
│   └── AccountFactory.ts        # Re-exporta common/factories/AccountFactory.ts
├── routes/
│   └── AuthRouter.ts
└── services/
    └── AuthService.ts
```

La implementación del **Factory Method** (`AccountCreator`, `ClientAccountCreator`, `ProfessionalAccountCreator` y `AccountFactory`) vive en `src/common/factories/AccountFactory.ts`.

---
