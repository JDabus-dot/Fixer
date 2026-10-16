# Decisiones de Diseño

El presente documento intenta detallar las decisiones de diseño que se trabajaron en el repositorio para el backend.

## Diagnostico

Sobre el código analizado del backend se detectaron dos problemas de diseño, cada uno con un costo concreto de mantenimiento.

1. Problema 1: condicional creciente en el registro (AuthService).
En el flujo de registro se crean entidades distintas según el rol: un Cliente genera solo un usuario, mientras que un Profesional genera un usuario y además su perfil (ProfessionalProfileModel). Esa decisión estaba resuelta dentro de AuthService con un condicional if (dto.isPro), lo que implica que esta clase conoce detalles de cómo se instancia un perfil profesional. Esto tiene tres consecuencias:

- Viola OCP: cada rol nuevo (por ejemplo, empresa o contratista) obliga a modificar AuthService, una clase estable y sensible porque maneja autenticación y emisión del JWT.
- Viola SRP: AuthService tiene dos motivos de cambio distintos, la lógica de autenticación y la lógica de creación de cada tipo de cuenta.
- Genera acoplamiento fuerte: un cambio en la estructura del perfil profesional impacta en el servicio de autenticación.

Las variantes (Cliente y Profesional) evolucionan de forma independiente, por lo que se decide separar su creación mediante el patrón creacional Factory Method: una clase abstracta AccountCreator con una subclase por rol, de modo que AuthService dependa de la abstracción y no de las clases concretas.   

2. Problema 2: objeto con demasiados atributos (ProfessionalProfileModel).
El perfil profesional tiene más de 18 atributos (rubro, matrícula, ubicación, radio de cobertura, disponibilidad de urgencias, reputación, etc.). Instanciarlo en un solo paso implica constructores con una lista extensa de parámetros, difíciles de invocar, de recordar en orden y de extender sin romper los llamados existentes. Esto vuelve costosos los seeders y los tests, donde se necesitan perfiles con distintas combinaciones de datos.

Para centralizar la creación y permitir una construcción paso a paso con valores por defecto razonables, se decide implementar el patrón creacional Builder (ProfessionalProfileBuilder).

Alcance de los patrones. Dado el tamaño del proyecto y el objetivo MVP, no se justifica incorporar patrones de comportamiento, estructurales ni el creacional Singleton: no hay una tensión concreta de diseño que resuelvan, y su implementación sumaría complejidad sin valor agregado.

## Alternativas

La alternativa seria no implementar el Factory y dejar solo el Builder, pero romperia con un principio basico del SOLID. Entendemos dada la complejidad del objeto de perfil de profesional es altamente critico la implementacion del Builder, salvo que desglosemos la clase Profesional en clases interelacionadas, pero aumentariamos la interdependencia de clase y el acoplamiento.

## Decisión

Implementar Factory Method para la creación de cuentas y Builder para la construcción del perfil profesional.

## Evidencia

### Factory

```typescript
// common/factories/AccountFactory.ts
export interface ICreatedAccount {
  user: UserModel;
  profile?: ProfessionalProfileModel;
}

export abstract class AccountCreator {
  public abstract createAccount(dto: RegisterDTO, passwordHash: string): Promise<ICreatedAccount>;
}

export class ClientAccountCreator extends AccountCreator {
  public async createAccount(dto: RegisterDTO, passwordHash: string): Promise<ICreatedAccount> {
    const user = await UserModel.create({ /* ...datos cliente */ role: 'CLIENT' });
    return { user };
  }
}

export class ProfessionalAccountCreator extends AccountCreator {
  public async createAccount(dto: RegisterDTO, passwordHash: string): Promise<ICreatedAccount> {
    const user = await UserModel.create({ /* ...datos usuario */ role: 'PROFESSIONAL' });
    const profile = await ProfessionalProfileModel.create({
      userId: user.id,
      tradeCategory: dto.tradeCategory || 'otro',
      isVerified: false,
      badgeLevel: 'Nuevo Profesional'
    });
    return { user, profile };
  }
}
```

**Beneficios SOLID:**
- **SRP (Single Responsibility)**: `AuthService` solo maneja la orquestación y generación de JWT; delega la creación a la fábrica.
- **OCP (Open/Closed)**: Si mañana agregás un rol `ENTERPRISE` o `COMPANY_CONTRACTOR`, creás una nueva subclase sin modificar `AuthService`.

### Builder

```typescript
// modules/professionals/builders/ProfessionalProfileBuilder.ts
export class ProfessionalProfileBuilder {
  private profileData: Partial<IProfessionalProfileAttributes> = {
    coverageRadiusKm: 15,
    basePrice: 10000,
    responseTime: '< 30 min',
    isEmergencyAvailable: false,
    isVerified: false,
    ratingAverage: 5.0,
    totalReviews: 0,
    specialties: []
  };

  constructor(userId: string) {
    this.profileData.userId = userId;
  }

  public withTrade(category: string, headline: string, licenseNumber: string): this {
    this.profileData.tradeCategory = category;
    this.profileData.headline = headline;
    this.profileData.licenseNumber = licenseNumber;
    return this;
  }

  public withLocation(city: string, zone: string, address: string, radiusKm = 20): this {
    this.profileData.city = city;
    this.profileData.zone = zone;
    this.profileData.address = address;
    this.profileData.coverageRadiusKm = radiusKm;
    return this;
  }

  public withEmergencyAvailability(responseTime = '< 20 min'): this {
    this.profileData.isEmergencyAvailable = true;
    this.profileData.responseTime = responseTime;
    return this;
  }

  public withReputation(rating: number, totalReviews: number, badge = 'Verificado Fixer'): this {
    this.profileData.ratingAverage = rating;
    this.profileData.totalReviews = totalReviews;
    this.profileData.badgeLevel = badge;
    this.profileData.isVerified = true;
    return this;
  }

  public async build(): Promise<ProfessionalProfileModel> {
    return ProfessionalProfileModel.create(this.profileData as any);
  }
}
```

**Uso práctico (en Seeders, Tests o Servicios):**
```typescript
// Construcción fluida y auto-documentada de Carlos Mendoza
const carlosProfile = await new ProfessionalProfileBuilder(carlosUserId)
  .withTrade('plomeria', 'Plomería Integral & Gasista de 1ª', 'Matrícula Nº 48.912')
  .withLocation('Bahía Blanca', 'Palermo y Zona Norte', 'San Martín 228', 25)
  .withReputation(4.9, 142, 'Fixer Diamond')
  .withEmergencyAvailability('< 20 min')
  .build();
```

| Patrón | ¿Aplica? | Punto de aplicación en Fixer | Beneficio principal |
| :--- | :---: | :--- | :--- |
| **Factory** | **Sí** | Registro de cuentas (`Client` vs `Professional`) y Solicitudes (`Urgent` vs `Standard`) | Desacopla `AuthService` de la instanciación de perfiles (SRP / OCP). |
| **Builder** | **Sí** | Creación de `ProfessionalProfileModel` y armado de consultas en `ProfessionalRepository` | Elimina constructores gigantes con 18 parámetros y permite tests/seeders limpios y fluidos. |
